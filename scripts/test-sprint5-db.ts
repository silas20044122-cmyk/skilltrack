/**
 * SkillTrack - Sprint 5 Template Engine Integration Test Suite
 *
 * Exercises the Sprint 5 domain services against the configured database:
 * template authoring, structure editing, validation, ready-for-publication,
 * publishing (with archive of the previous published version), cloning and
 * version management. Gemini is never called here.
 */

import { prisma } from '../lib/db/prisma';
import { AppError } from '../lib/errors';
import {
  createCompetencyRule,
  createEvaluationItem,
  createSection,
  createTemplate,
  deleteCompetencyRule,
  getCurrentPublishedVersion,
  getPublishedTemplateStructure,
  getPublishedTemplatesForProgramme,
  markReadyForPublish,
  runTemplateValidation,
  transitionTemplateVersion,
  updateSection,
  updateTemplate,
} from '../modules/templates/service';
import { createDraftFromVersion, publishTemplateVersion } from '../modules/templates/publishing';
import { deleteSourceDocument } from '../modules/documents/service';

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
  templateIds: [] as string[],
  documentId: null as string | null,
};

async function cleanup() {
  try {
    for (const id of created.templateIds) {
      await prisma.mentoringTemplate.delete({ where: { id } }).catch(() => {});
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
  console.log('SkillTrack Sprint 5 - Template Engine Integration Test Suite');
  console.log('======================================================\n');

  const programme = await prisma.programme.findFirst({ where: { code: 'DICT-L6' } });
  if (!programme) {
    console.error('Seeded programme DICT-L6 is missing. Run `npm run db:seed` first.');
    process.exit(1);
  }
  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@skilltrack.gov.tvet' },
  });
  if (!adminUser) {
    console.error('Seeded admin user is missing. Run `npm run db:seed` first.');
    process.exit(1);
  }

  try {
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Template authoring and multiple templates per programme ---');
    const template = await createTemplate(
      { programmeId: programme.id, title: `Sprint5 Template ${RUN}` },
      adminUser.id
    );
    created.templateIds.push(template.id);
    assert(template.versions.length === 1, 'createTemplate creates one version');
    assert(template.versions[0].status === 'DRAFT', 'The first version is a DRAFT');

    const second = await createTemplate(
      { programmeId: programme.id, title: `Sprint5 Template B ${RUN}` },
      adminUser.id
    );
    created.templateIds.push(second.id);
    assert(second.id !== template.id, 'A programme can hold multiple templates');

    const renamed = await updateTemplate(
      template.id,
      { title: `Sprint5 Template Renamed ${RUN}` },
      adminUser.id
    );
    assert(renamed.title.startsWith('Sprint5 Template Renamed'), 'updateTemplate edits metadata');

    const version = template.versions[0];

    // -------------------------------------------------------------------------
    console.log('\n--- 2. Structure editing ---');
    const section = await createSection(
      {
        versionId: version.id,
        title: 'Section One',
        sectionNumber: '1',
        mappingStatus: 'UNMAPPED',
      },
      adminUser.id
    );
    assert(section.title === 'Section One', 'createSection adds a draft section');

    await updateSection(
      section.id,
      {
        title: 'Section One Edited',
        sectionNumber: '1',
        description: 'desc',
        sectionType: 'assessment',
        mappingStatus: 'MAPPED',
      },
      adminUser.id
    );
    assert(true, 'updateSection edits a draft section');

    await createEvaluationItem(
      { sectionId: section.id, description: 'Item one', itemNumber: '1', category: 'SKILL' },
      adminUser.id
    );
    const badRule = await createCompetencyRule(
      {
        versionId: version.id,
        sectionId: section.id,
        ruleType: 'REQUIRED_ITEMS',
        requiredItemNumbers: '99',
        sourceWording: 'Items 99 must be answered correctly.',
      },
      adminUser.id
    );

    // -------------------------------------------------------------------------
    console.log('\n--- 3. Validation ---');
    const failed = await runTemplateValidation(version.id, adminUser.id);
    assert(!failed.ok, 'Validation fails when a required item does not resolve');
    assert(
      failed.errors.some((issue) => issue.code === 'RULE_REQUIRED_ITEM_MISSING'),
      'The unresolved required item is reported as an error'
    );

    const persistedRun = await prisma.templateValidationRun.findFirst({
      where: { versionId: version.id },
      orderBy: { createdAt: 'desc' },
      include: { issues: true },
    });
    assert(persistedRun?.status === 'FAILED', 'A failing validation run is persisted');
    assert((persistedRun?.issues.length ?? 0) > 0, 'Validation issues are persisted with the run');

    let markBlocked = false;
    try {
      await markReadyForPublish({ versionId: version.id }, adminUser.id);
    } catch (error) {
      markBlocked = error instanceof AppError && error.code === 'INVALID_STATE';
    }
    assert(markBlocked, 'markReadyForPublish is blocked while validation fails');

    await deleteCompetencyRule(badRule.id, adminUser.id);
    await createCompetencyRule(
      {
        versionId: version.id,
        sectionId: section.id,
        ruleType: 'MINIMUM_COUNT',
        minimumCorrect: 1,
        sourceWording: 'At least 1 item must be answered correctly.',
      },
      adminUser.id
    );

    const passed = await runTemplateValidation(version.id, adminUser.id);
    assert(passed.ok, 'Validation passes once blocking errors are resolved');

    // -------------------------------------------------------------------------
    console.log('\n--- 4. Ready for publication and publishing ---');
    const ready = await markReadyForPublish({ versionId: version.id }, adminUser.id);
    assert(ready.status === 'READY_FOR_PUBLISH', 'markReadyForPublish transitions the version');

    let editLocked = false;
    try {
      await updateSection(
        section.id,
        { title: 'Should fail', mappingStatus: 'UNMAPPED' },
        adminUser.id
      );
    } catch (error) {
      editLocked = error instanceof AppError && error.code === 'INVALID_STATE';
    }
    assert(editLocked, 'A ready-for-publication version is immutable');

    const published = await publishTemplateVersion(version.id, adminUser.id);
    assert(published.version.versionNumber === 1, 'publishTemplateVersion publishes the draft');
    assert(
      published.report.ok && published.report.rulesetVersion === '1.0.0',
      'Publishing re-runs validation and returns the report'
    );

    const current = await getCurrentPublishedVersion(template.id);
    assert(current?.id === version.id, 'The published version is the current one');

    const structure = await getPublishedTemplateStructure(version.id);
    assert(
      structure.sections.length === 1 && structure.sections[0].evaluationItems.length === 1,
      'getPublishedTemplateStructure returns the full published structure'
    );

    const programmePublished = await getPublishedTemplatesForProgramme(programme.id);
    assert(
      programmePublished.some((entry) => entry.template.id === template.id),
      'getPublishedTemplatesForProgramme lists the template with its published version'
    );

    // -------------------------------------------------------------------------
    console.log('\n--- 5. Cloning and version management ---');
    const draft2 = await createDraftFromVersion(version.id, adminUser.id);
    assert(draft2.status === 'DRAFT', 'createDraftFromVersion creates a new DRAFT');
    assert(draft2.versionNumber === 2, 'The cloned version gets the next number');
    assert(draft2.basedOnVersionId === version.id, 'The clone records its lineage');

    const cloned = await prisma.templateSection.findFirst({
      where: { versionId: draft2.id },
      include: { evaluationItems: true, competencyRules: true },
    });
    assert(
      cloned?.evaluationItems.length === 1 && cloned.competencyRules.length === 1,
      'Cloning copies sections, items and rules'
    );

    // Transition guardrails.
    let illegalTransition = false;
    try {
      await transitionTemplateVersion(draft2.id, 'READY_FOR_PUBLISH', adminUser.id);
    } catch (error) {
      illegalTransition = error instanceof AppError && error.code === 'INVALID_STATE';
    }
    assert(illegalTransition, 'DRAFT cannot skip directly to READY_FOR_PUBLISH');

    const inReview = await transitionTemplateVersion(draft2.id, 'IN_REVIEW', adminUser.id);
    assert(inReview.status === 'IN_REVIEW', 'A draft can move to IN_REVIEW');

    let publishViaTransition = false;
    try {
      await transitionTemplateVersion(draft2.id, 'PUBLISHED', adminUser.id);
    } catch (error) {
      publishViaTransition = error instanceof AppError && error.code === 'INVALID_STATE';
    }
    assert(publishViaTransition, 'Publishing must go through the validated publish service');

    const ready2 = await markReadyForPublish({ versionId: draft2.id }, adminUser.id);
    assert(ready2.status === 'READY_FOR_PUBLISH', 'An in-review version can be marked ready');

    await publishTemplateVersion(draft2.id, adminUser.id);
    const archived = await prisma.mentoringTemplateVersion.findUnique({
      where: { id: version.id },
      select: { status: true, archivedAt: true },
    });
    assert(archived?.status === 'ARCHIVED', 'Publishing a new version archives the previous one');
    assert(archived?.archivedAt instanceof Date, 'The archived version records archivedAt');

    const current2 = await getCurrentPublishedVersion(template.id);
    assert(current2?.id === draft2.id, 'The newest published version becomes current');

    let archivedNotConsumable = false;
    try {
      await getPublishedTemplateStructure(version.id);
    } catch (error) {
      archivedNotConsumable = error instanceof AppError && error.code === 'INVALID_STATE';
    }
    assert(archivedNotConsumable, 'An archived version cannot be consumed as published');

    // -------------------------------------------------------------------------
    console.log('\n--- 6. Source document deletion guard ---');
    const document = await prisma.sourceDocument.create({
      data: {
        programmeId: programme.id,
        fileName: `sprint5-${RUN}.pdf`,
        storageKey: `test/sprint5-${RUN}.pdf`,
        fileHash: 'a'.repeat(64),
        fileSize: 1024,
        mimeType: 'application/pdf',
        status: 'REVIEW_REQUIRED',
      },
    });
    created.documentId = document.id;

    const docTemplate = await prisma.mentoringTemplate.create({
      data: {
        programmeId: programme.id,
        title: `Sprint5 Doc Template ${RUN}`,
        sourceDocumentId: document.id,
        versions: {
          create: { versionNumber: 1, status: 'READY_FOR_PUBLISH', sourceDocumentId: document.id },
        },
      },
    });
    created.templateIds.push(docTemplate.id);

    let deleteBlocked = false;
    try {
      await deleteSourceDocument(document.id, adminUser.id);
    } catch (error) {
      deleteBlocked = error instanceof AppError && error.code === 'INVALID_STATE';
    }
    assert(deleteBlocked, 'deleteSourceDocument is blocked while a version is ready/published');

    await prisma.mentoringTemplate.delete({ where: { id: docTemplate.id } });
    created.templateIds = created.templateIds.filter((id) => id !== docTemplate.id);
    await deleteSourceDocument(document.id, adminUser.id);
    created.documentId = null;
    assert(true, 'deleteSourceDocument succeeds once no ready/published version remains');
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
