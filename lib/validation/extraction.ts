import { z } from 'zod';

/**
 * SkillTrack — Gemini extraction contract (v1).
 *
 * Gemini is asked to return this exact structured shape. It is a *contract*,
 * not prose: the application validates it before anything is persisted. Source
 * wording is preserved verbatim; interpretation is kept in separate fields.
 *
 * The contract is intentionally generic — no department, section count, item
 * category or competency formula is hard-coded. Unknown categories fall back to
 * OTHER and unknown top-level keys are ignored, so future PDFs are supported
 * without code changes.
 */

export const EVALUATION_CATEGORIES = [
  'KNOWLEDGE',
  'SKILL',
  'ATTITUDE',
  'OTHER',
] as const;

export const COMPETENCY_RULE_TYPES = [
  'MINIMUM_COUNT',
  'MINIMUM_PERCENTAGE',
  'REQUIRED_ITEMS',
  'COMPOSITE',
  'OTHER',
] as const;

export const WARNING_TYPES = [
  'SOURCE_INCONSISTENCY',
  'AMBIGUOUS_MAPPING',
  'MISSING_DATA',
  'DUPLICATE_ITEM',
  'OTHER',
] as const;

export const WARNING_SEVERITIES = ['INFO', 'WARNING', 'ERROR'] as const;

const trimmed = (max = 2000) => z.string().trim().min(1).max(max);

export const extractionMetadataSchema = z.object({
  title: trimmed(300),
  programme: z.string().trim().max(300).nullish(),
  documentTitle: z.string().trim().max(300).nullish(),
  sourceNotes: z.string().trim().max(4000).nullish(),
});

export const extractedEvaluationItemSchema = z.object({
  itemNumber: z.string().trim().max(50).nullish(),
  description: trimmed(4000),
  // Original wording from the PDF. Never silently rewritten.
  sourceWording: z.string().trim().max(4000).nullish(),
  category: z.enum(EVALUATION_CATEGORIES).catch('OTHER'),
  displayOrder: z.number().int().nonnegative().nullish(),
  sourceLocation: z.string().trim().max(200).nullish(),
});

export const extractedCompetencyRuleSchema = z.object({
  ruleType: z.enum(COMPETENCY_RULE_TYPES).catch('OTHER'),
  minimumCorrect: z.number().int().nonnegative().nullish(),
  minimumPercentage: z.number().min(0).max(100).nullish(),
  requiredItemNumbers: z.array(z.string().trim().min(1).max(50)).default([]),
  // Free-form additional structure for future rule shapes.
  conditions: z.record(z.string(), z.unknown()).nullish(),
  sourceWording: trimmed(4000),
  notes: z.string().trim().max(2000).nullish(),
});

export const extractedSectionSchema = z.object({
  sectionNumber: z.string().trim().max(50).nullish(),
  title: trimmed(400),
  description: z.string().trim().max(6000).nullish(),
  sectionType: z.string().trim().max(120).nullish(),
  displayOrder: z.number().int().nonnegative().nullish(),
  // Optional reference to a parent by the parent's `sectionNumber`.
  parentSectionNumber: z.string().trim().max(50).nullish(),
  sourceLocation: z.string().trim().max(200).nullish(),
  items: z.array(extractedEvaluationItemSchema).default([]),
  competencyRules: z.array(extractedCompetencyRuleSchema).default([]),
});

export const extractionWarningSchema = z.object({
  type: z.enum(WARNING_TYPES).catch('OTHER'),
  message: trimmed(4000),
  sourceReference: z.string().trim().max(400).nullish(),
  severity: z.enum(WARNING_SEVERITIES).catch('WARNING'),
});

export const extractionResultSchema = z.object({
  template: extractionMetadataSchema,
  sections: z.array(extractedSectionSchema).min(1, 'At least one section is required.'),
  warnings: z.array(extractionWarningSchema).default([]),
});

export type ExtractionResult = z.infer<typeof extractionResultSchema>;
export type ExtractedSection = z.infer<typeof extractedSectionSchema>;
export type ExtractedEvaluationItem = z.infer<typeof extractedEvaluationItemSchema>;
export type ExtractedCompetencyRule = z.infer<typeof extractedCompetencyRuleSchema>;
export type ExtractionWarning = z.infer<typeof extractionWarningSchema>;

/**
 * Semantic checks that cannot be expressed by the schema alone. These become
 * warnings for the administrator rather than hard failures, so a slightly
 * imperfect extraction can still be reviewed and corrected.
 */
export function collectExtractionWarnings(
  result: ExtractionResult
): Array<{ type: string; message: string; severity: string; sourceReference?: string | null }> {
  const warnings: Array<{
    type: string;
    message: string;
    severity: string;
    sourceReference?: string | null;
  }> = [...result.warnings];

  const numbers = new Set<string>();

  result.sections.forEach((section, sectionIndex) => {
    const label = section.sectionNumber || `#${sectionIndex + 1}`;
    const seenItems = new Set<string>();

    section.items.forEach((item, itemIndex) => {
      if (!item.itemNumber) {
        warnings.push({
          type: 'MISSING_DATA',
          severity: 'WARNING',
          message: `Section ${label}: item ${itemIndex + 1} has no item number.`,
          sourceReference: section.sourceLocation ?? null,
        });
        return;
      }
      if (seenItems.has(item.itemNumber)) {
        warnings.push({
          type: 'DUPLICATE_ITEM',
          severity: 'WARNING',
          message: `Section ${label}: duplicate item number "${item.itemNumber}".`,
          sourceReference: section.sourceLocation ?? null,
        });
      }
      seenItems.add(item.itemNumber);
    });

    // A rule may only require items that exist in the same section.
    for (const rule of section.competencyRules) {
      for (const required of rule.requiredItemNumbers) {
        if (!seenItems.has(required)) {
          warnings.push({
            type: 'MISSING_DATA',
            severity: 'WARNING',
            message: `Section ${label}: rule requires item "${required}" which was not extracted.`,
            sourceReference: section.sourceLocation ?? null,
          });
        }
      }
    }

    if (section.sectionNumber) {
      if (numbers.has(section.sectionNumber)) {
        warnings.push({
          type: 'DUPLICATE_ITEM',
          severity: 'WARNING',
          message: `Duplicate section number "${section.sectionNumber}".`,
          sourceReference: section.sourceLocation ?? null,
        });
      }
      numbers.add(section.sectionNumber);
    }
  });

  // Parent references must resolve to a known section number.
  const knownSections = new Set(
    result.sections.map((s) => s.sectionNumber).filter((n): n is string => Boolean(n))
  );
  for (const section of result.sections) {
    if (section.parentSectionNumber && !knownSections.has(section.parentSectionNumber)) {
      warnings.push({
        type: 'MISSING_DATA',
        severity: 'WARNING',
        message: `Section "${section.title}" references missing parent "${section.parentSectionNumber}".`,
        sourceReference: section.sourceLocation ?? null,
      });
    }
  }

  return warnings;
}
