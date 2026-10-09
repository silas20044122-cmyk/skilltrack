/**
 * SkillTrack - Sprint 4 Database & Storage Integration Test Suite
 *
 * Exercises the Sprint 4 domain services against the configured database and
 * object storage. It creates temporary records and always cleans them up.
 * Gemini itself is not called here; the real extraction E2E is a separate,
 * opt-in script (scripts/test-sprint4-e2e.ts).
 */

import { prisma } from '../lib/db/prisma';
import { AppError } from '../lib/errors';
import {
  createCurriculumUnit,
  listCurriculumUnits,
  setCurriculumUnitStatus,
  updateCurriculumUnit,
} from '../modules/curriculum/service';
import {
  deleteSourceDocument,
  getSourceDocumentFile,
  uploadSourceDocument,
} from '../modules/documents/service';
import { runExtraction } from '../modules/documents/extraction/service';
import {
  getTemplateVersion,
  markReadyForPublish,
  setSectionMapping,
  updateSection,
} from '../modules/templates/service';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, failureDetails?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  PASS: ${testName}`);
  } else {
    console.error(`  FAIL: ${testName}`);
    if (failureDetails) console.error(`    Details: ${failureDetails}`);
    process.exitCode = 1;
  }
}

const RUN = Date.now().toString(36);
const created = {
  unitId: null as string | null,
  templateId: null as string | null,
  documentId: null as string | null,
};

// Minimal but structurally valid PDF bytes (a PDF header/trailer is enough for
// a storage round-trip; we are not asking Gemini to parse this fixture here).
function samplePdf() {
  return Buffer.from(
    '%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n',
    'utf8'
  );
}

async function cleanup() {
  try {
    if (created.templateId) {
      await prisma.mentoringTemplate.delete({ where: { id: created.templateId } }).catch(() => {});
    }
    if (created.unitId) {
      await prisma.curriculumUnit.delete({ where: { id: created.unitId } }).catch(() => {});
    }
    if (created.documentId) {
      await prisma.sourceDocument.delete({ where: { id: created.documentId } }).catch(() => {});
    }
  } catch {
    // best-effort
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('SkillTrack Sprint 4 - DB & Storage Integration Test Suite');
  console.log('======================================================\n');

  const programme = await prisma.programme.findFirst({ where: { code: 'DICT-L6' } });
  if (!programme) {
    console.error('Seeded programme DICT-L6 is missing. Run `npm run db:seed` first.');
    process.exit(1);
  }
  const admin = await prisma.user.findUnique({ where: { email: 'admin@skilltrack.gov.tvet' } });
  if (!admin) {
    console.error('Seeded admin user is missing. Run `npm run db:seed` first.');
    process.exit(1);
  }

  try {
    // -------------------------------------------------------------------------
    console.log('--- 1. Curriculum units ---');
    const code = `T4-${RUN}`.toUpperCase();
    const unit = await createCurriculumUnit(
      {
        programmeId: programme.id,
        name: `Test Unit ${RUN}`,
        code,
        position: 99,
      },
      admin.id
    );
    created.unitId = unit.id;
    assert(unit.code === code, 'createCurriculumUnit persists the unit');
    assert(unit.status === 'ACTIVE', 'A new unit is ACTIVE by default');

    const listed = await listCurriculumUnits(programme.id);
    assert(
      listed.some((u) => u.id === unit.id),
      'listCurriculumUnits returns the new unit'
    );

    const renamed = await updateCurriculumUnit(
      unit.id,
      { name: `Renamed ${RUN}`, code, description: 'updated' },
      admin.id
    );
    assert(renamed.name === `Renamed ${RUN}`, 'updateCurriculumUnit updates fields');

    const inactive = await setCurriculumUnitStatus(unit.id, 'INACTIVE', admin.id);
    assert(inactive.status === 'INACTIVE', 'setCurriculumUnitStatus changes status');

    let duplicateRejected = false;
    try {
      await createCurriculumUnit(
        { programmeId: programme.id, name: 'Dup', code },
        admin.id
      );
    } catch {
      duplicateRejected = true;
    }
    assert(duplicateRejected, 'Duplicate unit code within a programme is rejected');

    // -------------------------------------------------------------------------
    console.log('\n--- 2. Templates: editing, mapping and validation ---');
    const template = await prisma.mentoringTemplate.create({
      data: {
        programmeId: programme.id,
        title: `Test Template ${RUN}`,
        versions: {
          create: {
            versionNumber: 1,
            status: 'DRAFT',
            title: `Test Template ${RUN}`,
          },
        },
      },
      include: { versions: true },
    });
    created.templateId = template.id;
    const version = template.versions[0];

    const section = await prisma.templateSection.create({
      data: {
        versionId: version.id,
        sectionNumber: '1',
        title: 'Section One',
        displayOrder: 0,
      },
    });
    await prisma.evaluationItem.create({
      data: { sectionId: section.id, itemNumber: '1', description: 'An item', category: 'SKILL' },
    });

    const edited = await updateSection(
      section.id,
      {
        title: 'Section One Edited',
        sectionNumber: '1',
        description: 'desc',
        sectionType: 'assessment',
        mappingStatus: 'MAPPED',
      },
      admin.id
    );
    assert(edited.title === 'Section One Edited', 'updateSection edits a draft section');

    await setSectionMapping(
      { sectionId: section.id, mappingStatus: 'MAPPED', unitIds: [created.unitId!] },
      admin.id
    );
    const withMapping = await getTemplateVersion(version.id);
    assert(
      withMapping?.sections[0].curriculumUnitLinks.length === 1,
      'setSectionMapping links a curriculum unit'
    );

    const validated = await markReadyForPublish({ versionId: version.id }, admin.id);
    assert(
      validated.status === 'READY_FOR_PUBLISH',
      'markReadyForPublish marks the version READY_FOR_PUBLISH'
    );

    let immutable = false;
    try {
      await updateSection(
        section.id,
        { title: 'Should fail', mappingStatus: 'UNMAPPED' },
        admin.id
      );
    } catch (error) {
      immutable = error instanceof AppError && error.code === 'INVALID_STATE';
    }
    assert(immutable, 'A validated version is immutable (INVALID_STATE)');

    // -------------------------------------------------------------------------
    console.log('\n--- 3. Source document storage round-trip ---');
    const pdf = samplePdf();
    let storageOk = true;
    let storageDetail = '';
    try {
      const document = await uploadSourceDocument(
        {
          programmeId: programme.id,
          fileName: `sprint4-${RUN}.pdf`,
          mimeType: 'application/pdf',
          data: pdf,
        },
        admin.id
      );
      created.documentId = document.id;
      assert(document.status === 'UPLOADED', 'uploadSourceDocument persists metadata');
      assert(
        document.fileHash !== null && document.fileHash.length === 64,
        'uploadSourceDocument computes a SHA-256 hash'
      );

      const fetched = await getSourceDocumentFile(document.id);
      assert(
        fetched !== null && Buffer.compare(fetched.data, pdf) === 0,
        'getSourceDocumentFile returns the stored bytes'
      );

      await deleteSourceDocument(document.id, admin.id);
      const gone = await prisma.sourceDocument.findUnique({ where: { id: document.id } });
      created.documentId = null;
      assert(gone === null, 'deleteSourceDocument removes the record');
    } catch (error) {
      storageOk = false;
      storageDetail = error instanceof Error ? error.message : String(error);
      console.error(`    Storage error: ${storageDetail}`);
    }
    if (!storageOk) {
      assert(false, 'Source document storage round-trip', storageDetail);
    }

    // -------------------------------------------------------------------------
    console.log('\n--- 4. Extraction guard rails (no Gemini call) ---');
    let missingDoc = false;
    try {
      await runExtraction('00000000-0000-4000-8000-000000000000', admin.id);
    } catch (error) {
      missingDoc = error instanceof AppError && error.code === 'NOT_FOUND';
    }
    assert(missingDoc, 'runExtraction rejects an unknown document before calling Gemini');
  } finally {
    await cleanup();
  }

  console.log('\n======================================================');
  console.log(`Test Execution Finished: ${passedTests}/${totalTests} Passed`);
  console.log('======================================================\n');

  if (passedTests !== totalTests) process.exit(1);
}

runTestSuite()
  .catch((error) => {
    console.error('Fatal test error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
