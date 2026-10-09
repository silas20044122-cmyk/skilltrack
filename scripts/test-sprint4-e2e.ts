/**
 * SkillTrack - Sprint 4 Real Extraction E2E (opt-in)
 *
 * Runs the full pipeline against a real mentoring-tool PDF using the configured
 * Gemini model: upload → extraction → draft version. This makes network and
 * API calls, so it only runs when SPRINT4_E2E=1 is set.
 *
 *   $env:SPRINT4_E2E=1; npx tsx scripts/test-sprint4-e2e.ts
 *
 * Optional:
 *   SPRINT4_E2E_PDF     path to the PDF (defaults to the ICT Level 6 tool)
 *   SPRINT4_E2E_KEEP=1  keep the created document/version for manual review
 */

import { readFileSync, existsSync } from 'node:fs';
import { prisma } from '../lib/db/prisma';
import { uploadSourceDocument } from '../modules/documents/service';
import { runExtraction } from '../modules/documents/extraction/service';
import { getTemplateVersion } from '../modules/templates/service';

const DEFAULT_PDF =
  'C:\\Users\\LENOVO T460s\\Downloads\\Logbook\\Mentoring Tool ICT technician level 6- Final.pdf';

async function main() {
  if (process.env.SPRINT4_E2E !== '1') {
    console.log('Skipping Sprint 4 real extraction E2E (set SPRINT4_E2E=1 to run).');
    return;
  }
  if (!process.env.GEMINI_API_KEY) {
    console.log('Skipping: GEMINI_API_KEY is not configured.');
    return;
  }

  const pdfPath = process.env.SPRINT4_E2E_PDF || DEFAULT_PDF;
  if (!existsSync(pdfPath)) {
    console.error(`PDF not found: ${pdfPath}`);
    process.exit(1);
  }

  const programme = await prisma.programme.findFirst({ where: { code: 'DICT-L6' } });
  const admin = await prisma.user.findUnique({ where: { email: 'admin@skilltrack.gov.tvet' } });
  if (!programme || !admin) {
    console.error('Seeded data missing. Run `npm run db:seed` first.');
    process.exit(1);
  }

  const buffer = readFileSync(pdfPath);
  console.log(`Uploading ${pdfPath} (${buffer.byteLength} bytes)...`);
  const document = await uploadSourceDocument(
    {
      programmeId: programme.id,
      fileName: pdfPath.split(/[\\/]/).pop() || 'mentoring-tool.pdf',
      mimeType: 'application/pdf',
      data: buffer,
    },
    admin.id
  );

  console.log(`Running extraction with model ${process.env.GEMINI_MODEL ?? 'default'}...`);
  const result = await runExtraction(document.id, admin.id);
  const version = await getTemplateVersion(result.versionId);

  const itemCount =
    version?.sections.reduce((sum, section) => sum + section.evaluationItems.length, 0) ?? 0;
  const ruleCount =
    (version?.sections.reduce((sum, section) => sum + section.competencyRules.length, 0) ?? 0) +
    (version?.competencyRules.length ?? 0);

  console.log('\nExtraction result:');
  console.log(`  document:  ${document.id}`);
  console.log(`  run:       ${result.runId}`);
  console.log(`  version:   ${result.versionId}`);
  console.log(`  sections:  ${version?.sections.length ?? 0}`);
  console.log(`  items:     ${itemCount}`);
  console.log(`  rules:     ${ruleCount}`);
  console.log(`  warnings:  ${version?.warnings.length ?? 0}`);

  const assertions: Array<[boolean, string]> = [
    [(version?.sections.length ?? 0) > 0, 'At least one section was extracted'],
    [itemCount > 0, 'At least one evaluation item was extracted'],
  ];
  let failed = false;
  for (const [condition, label] of assertions) {
    console.log(`  ${condition ? 'PASS' : 'FAIL'}: ${label}`);
    if (!condition) failed = true;
  }

  if (process.env.SPRINT4_E2E_KEEP === '1') {
    console.log('\nKeeping created records for manual review (SPRINT4_E2E_KEEP=1).');
  } else {
    console.log('\nCleaning up created records...');
    await prisma.sourceDocument.delete({ where: { id: document.id } }).catch(() => {});
  }

  if (failed) process.exit(1);
}

main()
  .catch((error) => {
    console.error('Fatal E2E error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
