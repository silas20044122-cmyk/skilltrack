/**
 * SkillTrack - Sprint 4 Extraction Contract & Validation Test Suite
 *
 * Offline (database/Gemini-independent) checks for the extraction contract and
 * the Sprint 4 validation schemas that guard every administrative mutation.
 */

import {
  collectExtractionWarnings,
  extractionResultSchema,
} from '../lib/validation/extraction';
import {
  competencyRuleUpdateSchema,
  curriculumUnitSchema,
  evaluationItemUpdateSchema,
  sectionMappingSchema,
  sectionUpdateSchema,
  versionValidateSchema,
} from '../lib/validation/schemas';

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

const VALID_UUID = '11111111-1111-4111-8111-111111111111';

type Loose = Record<string, unknown>;
interface ExtractionFixture {
  template: Loose;
  sections: Array<Loose & { items: Loose[]; competencyRules: Loose[] }>;
  warnings: Loose[];
}

function validExtraction(): ExtractionFixture {
  return {
    template: {
      title: 'Mentoring Tool ICT technician level 6',
      programme: 'ICT Level 6',
      documentTitle: 'Mentoring Tool ICT technician level 6',
      sourceNotes: null,
    },
    sections: [
      {
        sectionNumber: '1',
        title: 'Perform Computer Essentials',
        description: null,
        sectionType: 'assessment',
        displayOrder: 0,
        parentSectionNumber: null,
        sourceLocation: 'page 2',
        items: [
          {
            itemNumber: '1',
            description: 'Start up and shut down a computer',
            sourceWording: 'Start up and shut down a computer',
            category: 'SKILL',
            displayOrder: 0,
            sourceLocation: 'page 2',
          },
        ],
        competencyRules: [
          {
            ruleType: 'MINIMUM_COUNT',
            minimumCorrect: 6,
            minimumPercentage: null,
            requiredItemNumbers: ['1'],
            conditions: null,
            sourceWording: 'Must pass 6 of 11 with item 1 mandatory',
            notes: null,
          },
        ],
      },
      {
        sectionNumber: '2',
        title: 'Worker Behaviour',
        description: null,
        sectionType: null,
        displayOrder: 1,
        parentSectionNumber: null,
        sourceLocation: null,
        items: [],
        competencyRules: [],
      },
    ],
    warnings: [],
  };
}

function runTestSuite() {
  console.log('\n======================================================');
  console.log('SkillTrack Sprint 4 - Extraction Contract Test Suite');
  console.log('======================================================\n');

  // ---------------------------------------------------------------------------
  console.log('--- 1. Extraction Contract (root) ---');
  const ok = extractionResultSchema.safeParse(validExtraction());
  assert(ok.success, 'A well-formed extraction result parses');

  const noSections = validExtraction();
  noSections.sections = [];
  assert(!extractionResultSchema.safeParse(noSections).success, 'Zero sections is rejected');

  const missingTitle = validExtraction();
  (missingTitle.template as { title?: string }).title = '';
  assert(!extractionResultSchema.safeParse(missingTitle).success, 'Empty template title is rejected');

  const noWarnings = validExtraction();
  delete (noWarnings as { warnings?: unknown }).warnings;
  const parsedNoWarnings = extractionResultSchema.safeParse(noWarnings);
  assert(
    parsedNoWarnings.success && parsedNoWarnings.data.warnings.length === 0,
    'warnings defaults to an empty array when omitted'
  );

  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Unknown categories degrade to OTHER ---');
  const unknownCategory = validExtraction();
  unknownCategory.sections[0].items[0].category = 'PSYCHOMOTOR';
  const parsedUnknown = extractionResultSchema.safeParse(unknownCategory);
  assert(
    parsedUnknown.success && parsedUnknown.data.sections[0].items[0].category === 'OTHER',
    'An unrecognised item category falls back to OTHER'
  );

  const unknownRuleType = validExtraction();
  unknownRuleType.sections[0].competencyRules[0].ruleType = 'SOMETHING_NEW';
  const parsedRule = extractionResultSchema.safeParse(unknownRuleType);
  assert(
    parsedRule.success && parsedRule.data.sections[0].competencyRules[0].ruleType === 'OTHER',
    'An unrecognised rule type falls back to OTHER'
  );

  const extraKeys = validExtraction() as unknown as Record<string, unknown>;
  extraKeys.unexpectedTopLevel = 'ignored';
  assert(
    extractionResultSchema.safeParse(extraKeys).success,
    'Unknown top-level keys are ignored (forward compatible)'
  );

  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Semantic Warnings ---');
  const duplicateItems = validExtraction();
  duplicateItems.sections[0].items.push({
    itemNumber: '1',
    description: 'Duplicate number',
    sourceWording: null,
    category: 'SKILL',
    displayOrder: 1,
    sourceLocation: null,
  });
  const dupWarnings = collectExtractionWarnings(extractionResultSchema.parse(duplicateItems));
  assert(
    dupWarnings.some((w) => w.type === 'DUPLICATE_ITEM'),
    'Duplicate item numbers produce a DUPLICATE_ITEM warning'
  );

  const missingRequired = validExtraction();
  missingRequired.sections[0].competencyRules[0].requiredItemNumbers = ['999'];
  const missingWarnings = collectExtractionWarnings(
    extractionResultSchema.parse(missingRequired)
  );
  assert(
    missingWarnings.some((w) => w.type === 'MISSING_DATA'),
    'A rule requiring an absent item produces a MISSING_DATA warning'
  );

  const duplicateSections = validExtraction();
  duplicateSections.sections[1].sectionNumber = '1';
  const dupSectionWarnings = collectExtractionWarnings(
    extractionResultSchema.parse(duplicateSections)
  );
  assert(
    dupSectionWarnings.some((w) => w.message.includes('Duplicate section number')),
    'Duplicate section numbers produce a warning'
  );

  const orphanParent = validExtraction();
  orphanParent.sections[1].parentSectionNumber = '99';
  const orphanWarnings = collectExtractionWarnings(extractionResultSchema.parse(orphanParent));
  assert(
    orphanWarnings.some((w) => w.message.includes('missing parent')),
    'An unresolved parent section produces a warning'
  );

  const cleanWarnings = collectExtractionWarnings(extractionResultSchema.parse(validExtraction()));
  assert(cleanWarnings.length === 0, 'A clean extraction produces no warnings');

  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Curriculum Unit Schema ---');
  const unit = curriculumUnitSchema.safeParse({
    programmeId: VALID_UUID,
    name: 'Perform Computer Essentials',
    code: 'cu-01',
    description: '',
    position: '0',
  });
  assert(unit.success, 'A valid curriculum unit parses');
  assert(unit.success && unit.data.code === 'CU-01', 'Unit code is normalised to uppercase');
  assert(
    unit.success && unit.data.description === undefined && unit.data.position === 0,
    'Blank description becomes undefined and position is coerced'
  );
  assert(
    !curriculumUnitSchema.safeParse({
      programmeId: 'not-a-uuid',
      name: 'Bad',
      code: 'CU-99',
    }).success,
    'A non-UUID programme id is rejected'
  );

  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Template Editing Schemas ---');
  assert(
    sectionUpdateSchema.safeParse({
      title: 'Section A',
      sectionNumber: '1',
      description: '',
      sectionType: '',
      mappingStatus: 'MAPPED',
    }).success,
    'A valid section update parses'
  );
  assert(
    !sectionUpdateSchema.safeParse({ title: 'Section A', mappingStatus: 'DONE' }).success,
    'An invalid mapping status is rejected'
  );
  assert(
    evaluationItemUpdateSchema.safeParse({
      description: 'Do the thing',
      category: 'ATTITUDE',
    }).success,
    'A valid evaluation item update parses'
  );
  assert(
    !evaluationItemUpdateSchema.safeParse({ description: 'x', category: 'WRONG' }).success,
    'An invalid evaluation category is rejected'
  );
  assert(
    competencyRuleUpdateSchema.safeParse({
      ruleType: 'MINIMUM_PERCENTAGE',
      minimumPercentage: '75',
      sourceWording: '75% of items',
    }).success,
    'A valid competency rule update parses'
  );
  assert(
    !competencyRuleUpdateSchema.safeParse({
      ruleType: 'MINIMUM_PERCENTAGE',
      minimumPercentage: '150',
      sourceWording: 'over 100%',
    }).success,
    'A percentage above 100 is rejected'
  );
  assert(
    !competencyRuleUpdateSchema.safeParse({
      ruleType: 'MINIMUM_COUNT',
      sourceWording: '',
    }).success,
    'Missing source wording is rejected'
  );
  const mapping = sectionMappingSchema.safeParse({
    sectionId: VALID_UUID,
    mappingStatus: 'MAPPED',
    unitIds: [VALID_UUID],
  });
  assert(mapping.success, 'A valid section mapping parses');
  const mappingDefault = sectionMappingSchema.safeParse({
    sectionId: VALID_UUID,
    mappingStatus: 'UNMAPPED',
  });
  assert(
    mappingDefault.success && mappingDefault.data.unitIds.length === 0,
    'Mapping unit ids default to an empty array'
  );
  assert(
    versionValidateSchema.safeParse({ versionId: VALID_UUID, notes: '' }).success,
    'A valid version validation payload parses'
  );

  // ---------------------------------------------------------------------------
  console.log('\n======================================================');
  console.log(`Test Execution Finished: ${passedTests}/${totalTests} Passed`);
  console.log('======================================================\n');

  if (passedTests !== totalTests) process.exit(1);
}

runTestSuite();
