import { prisma } from '@/lib/db/prisma';
import { AppError } from '@/lib/errors';

/**
 * Sprint 5 — server-side template validation.
 *
 * Validation is the single source of truth for whether a draft may become
 * READY_FOR_PUBLISH or be published. It returns structured, field-level issues
 * that the Admin UI renders next to the affected section / item / rule /
 * mapping. It never silently repairs or approximates source requirements.
 *
 * The ruleset is deliberately generic: no department, section count, item
 * category or competency formula is hard-coded.
 */

export const TEMPLATE_RULESET_VERSION = '1.0.0';

export type ValidationSeverity = 'ERROR' | 'WARNING' | 'INFO';

export type ValidationEntityType = 'VERSION' | 'SECTION' | 'ITEM' | 'RULE' | 'MAPPING';

export interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  message: string;
  entityType?: ValidationEntityType;
  entityId?: string;
  field?: string;
}

export interface ValidationReport {
  versionId: string;
  revision: number;
  rulesetVersion: string;
  ok: boolean;
  errorCount: number;
  warningCount: number;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  issues: ValidationIssue[];
}

export async function validateTemplateDraft(versionId: string): Promise<ValidationReport> {
  const version = await prisma.mentoringTemplateVersion.findUnique({
    where: { id: versionId },
    include: {
      template: {
        select: {
          id: true,
          programmeId: true,
          title: true,
          programme: { select: { id: true, status: true } },
        },
      },
      sourceDocument: { select: { id: true, status: true } },
      extractionRun: { select: { id: true, status: true } },
      sections: {
        include: {
          evaluationItems: true,
          competencyRules: true,
          curriculumUnitLinks: {
            include: {
              curriculumUnit: {
                select: { id: true, programmeId: true, status: true, name: true },
              },
            },
          },
        },
      },
      competencyRules: { where: { sectionId: null } },
    },
  });

  if (!version) throw new AppError('The template version could not be found.', 'NOT_FOUND');

  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const error = (issue: ValidationIssue) => errors.push(issue);
  const warn = (issue: ValidationIssue) => warnings.push(issue);

  // -------------------------------------------------------------------------
  // Metadata
  // -------------------------------------------------------------------------
  const title = version.title ?? version.template.title;
  if (!title || title.trim().length === 0) {
    error({
      severity: 'ERROR',
      code: 'TITLE_REQUIRED',
      message: 'The template version must have a title.',
      entityType: 'VERSION',
      entityId: version.id,
      field: 'title',
    });
  }

  if (version.template.programme.status !== 'ACTIVE') {
    warn({
      severity: 'WARNING',
      code: 'PROGRAMME_INACTIVE',
      message: 'The associated programme is not active. Publishing is still permitted but should be reviewed.',
      entityType: 'VERSION',
      entityId: version.id,
      field: 'programmeId',
    });
  }

  if (version.sourceDocumentId && !version.sourceDocument) {
    error({
      severity: 'ERROR',
      code: 'SOURCE_DOCUMENT_MISSING',
      message: 'The referenced source document no longer exists.',
      entityType: 'VERSION',
      entityId: version.id,
      field: 'sourceDocumentId',
    });
  }

  if (version.extractionRunId && !version.extractionRun) {
    warn({
      severity: 'WARNING',
      code: 'EXTRACTION_RUN_MISSING',
      message: 'The referenced extraction run no longer exists; provenance is incomplete.',
      entityType: 'VERSION',
      entityId: version.id,
      field: 'extractionRunId',
    });
  }

  // -------------------------------------------------------------------------
  // Sections
  // -------------------------------------------------------------------------
  const sections = version.sections;
  if (sections.length === 0) {
    error({
      severity: 'ERROR',
      code: 'NO_SECTIONS',
      message: 'A template version must contain at least one section.',
      entityType: 'VERSION',
      entityId: version.id,
      field: 'sections',
    });
  }

  const sectionById = new Map(sections.map((section) => [section.id, section]));
  const seenNumbers = new Map<string, string>();

  for (const section of sections) {
    if (!section.title || section.title.trim().length === 0) {
      error({
        severity: 'ERROR',
        code: 'SECTION_TITLE_REQUIRED',
        message: 'Every section must have a title.',
        entityType: 'SECTION',
        entityId: section.id,
        field: 'title',
      });
    }

    if (section.displayOrder < 0) {
      error({
        severity: 'ERROR',
        code: 'SECTION_ORDER_INVALID',
        message: 'Section display order cannot be negative.',
        entityType: 'SECTION',
        entityId: section.id,
        field: 'displayOrder',
      });
    }

    if (section.parentSectionId && !sectionById.has(section.parentSectionId)) {
      error({
        severity: 'ERROR',
        code: 'SECTION_PARENT_INVALID',
        message: 'The section references a parent that does not belong to this template version.',
        entityType: 'SECTION',
        entityId: section.id,
        field: 'parentSectionId',
      });
    }

    if (section.sectionNumber) {
      const existing = seenNumbers.get(section.sectionNumber);
      if (existing) {
        warn({
          severity: 'WARNING',
          code: 'SECTION_NUMBER_DUPLICATE',
          message: `Section number "${section.sectionNumber}" is used by more than one section.`,
          entityType: 'SECTION',
          entityId: section.id,
          field: 'sectionNumber',
        });
      } else {
        seenNumbers.set(section.sectionNumber, section.id);
      }
    }
  }

  // Cycle detection over the parent chain.
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const hasCycle = (sectionId: string): boolean => {
    if (visiting.has(sectionId)) return true;
    if (visited.has(sectionId)) return false;
    visiting.add(sectionId);
    const section = sectionById.get(sectionId);
    if (section?.parentSectionId && sectionById.has(section.parentSectionId)) {
      if (hasCycle(section.parentSectionId)) return true;
    }
    visiting.delete(sectionId);
    visited.add(sectionId);
    return false;
  };
  for (const section of sections) {
    if (hasCycle(section.id)) {
      error({
        severity: 'ERROR',
        code: 'SECTION_CYCLE',
        message: 'Section parent references contain a cycle.',
        entityType: 'SECTION',
        entityId: section.id,
        field: 'parentSectionId',
      });
    }
  }

  // -------------------------------------------------------------------------
  // Evaluation items
  // -------------------------------------------------------------------------
  const itemNumbersBySection = new Map<string, Set<string>>();
  const itemNumbersByVersion = new Set<string>();

  for (const section of sections) {
    const numbers = new Set<string>();
    const seenItemNumbers = new Set<string>();

    for (const item of section.evaluationItems) {
      if (!item.description || item.description.trim().length === 0) {
        error({
          severity: 'ERROR',
          code: 'ITEM_DESCRIPTION_REQUIRED',
          message: 'Every evaluation item must have a description.',
          entityType: 'ITEM',
          entityId: item.id,
          field: 'description',
        });
      }

      if (item.displayOrder < 0) {
        error({
          severity: 'ERROR',
          code: 'ITEM_ORDER_INVALID',
          message: 'Item display order cannot be negative.',
          entityType: 'ITEM',
          entityId: item.id,
          field: 'displayOrder',
        });
      }

      if (item.itemNumber) {
        if (seenItemNumbers.has(item.itemNumber)) {
          warn({
            severity: 'WARNING',
            code: 'ITEM_NUMBER_DUPLICATE',
            message: `Item number "${item.itemNumber}" is duplicated within this section.`,
            entityType: 'ITEM',
            entityId: item.id,
            field: 'itemNumber',
          });
        }
        seenItemNumbers.add(item.itemNumber);
        numbers.add(item.itemNumber);
        itemNumbersByVersion.add(item.itemNumber);
      }
    }

    itemNumbersBySection.set(section.id, numbers);
  }

  // -------------------------------------------------------------------------
  // Competency rules
  // -------------------------------------------------------------------------
  const allRules = [
    ...version.competencyRules.map((rule) => ({ rule, section: null as null | (typeof sections)[number] })),
    ...sections.flatMap((section) =>
      section.competencyRules.map((rule) => ({ rule, section }))
    ),
  ];

  for (const { rule, section } of allRules) {
    const ruleLabel = rule.sourceWording?.trim() || rule.ruleType;

    if (!rule.sourceWording || rule.sourceWording.trim().length === 0) {
      error({
        severity: 'ERROR',
        code: 'RULE_WORDING_REQUIRED',
        message: 'Every competency rule must preserve its original source wording.',
        entityType: 'RULE',
        entityId: rule.id,
        field: 'sourceWording',
      });
    }

    if (
      rule.minimumPercentage !== null &&
      rule.minimumPercentage !== undefined &&
      (rule.minimumPercentage < 0 || rule.minimumPercentage > 100)
    ) {
      error({
        severity: 'ERROR',
        code: 'RULE_PERCENTAGE_RANGE',
        message: 'Minimum percentage must be between 0 and 100.',
        entityType: 'RULE',
        entityId: rule.id,
        field: 'minimumPercentage',
      });
    }

    if (
      rule.minimumCorrect !== null &&
      rule.minimumCorrect !== undefined &&
      rule.minimumCorrect < 0
    ) {
      error({
        severity: 'ERROR',
        code: 'RULE_MINIMUM_NEGATIVE',
        message: 'Minimum correct count cannot be negative.',
        entityType: 'RULE',
        entityId: rule.id,
        field: 'minimumCorrect',
      });
    }

    const applicableItems = section
      ? sections.find((s) => s.id === section.id)?.evaluationItems.length ?? 0
      : sections.reduce((sum, s) => sum + s.evaluationItems.length, 0);

    if (
      rule.minimumCorrect !== null &&
      rule.minimumCorrect !== undefined &&
      rule.minimumCorrect > applicableItems
    ) {
      error({
        severity: 'ERROR',
        code: 'RULE_MINIMUM_EXCEEDS_ITEMS',
        message: `The rule requires ${rule.minimumCorrect} correct item(s) but only ${applicableItems} item(s) are available.`,
        entityType: 'RULE',
        entityId: rule.id,
        field: 'minimumCorrect',
      });
    }

    // Rule type / field consistency (contradictory or unsupported conditions).
    if (rule.ruleType === 'MINIMUM_COUNT' && rule.minimumPercentage != null) {
      warn({
        severity: 'WARNING',
        code: 'RULE_CONDITION_CONFLICT',
        message: 'A minimum-count rule also defines a percentage; confirm the source rule.',
        entityType: 'RULE',
        entityId: rule.id,
        field: 'minimumPercentage',
      });
    }
    if (rule.ruleType === 'MINIMUM_PERCENTAGE' && rule.minimumCorrect != null) {
      warn({
        severity: 'WARNING',
        code: 'RULE_CONDITION_CONFLICT',
        message: 'A minimum-percentage rule also defines a correct count; confirm the source rule.',
        entityType: 'RULE',
        entityId: rule.id,
        field: 'minimumCorrect',
      });
    }
    if (rule.ruleType === 'REQUIRED_ITEMS') {
      const required = Array.isArray(rule.requiredItemNumbers) ? rule.requiredItemNumbers : [];
      if (required.length === 0) {
        warn({
          severity: 'WARNING',
          code: 'RULE_NO_REQUIRED_ITEMS',
          message: 'A required-items rule lists no required items.',
          entityType: 'RULE',
          entityId: rule.id,
          field: 'requiredItemNumbers',
        });
      }
    }
    if (
      (rule.ruleType === 'COMPOSITE' || rule.ruleType === 'OTHER') &&
      (rule.conditions === null || rule.conditions === undefined)
    ) {
      warn({
        severity: 'WARNING',
        code: 'RULE_CONDITIONS_UNSUPPORTED',
        message:
          'This rule type needs structured conditions to be evaluated deterministically; none are stored.',
        entityType: 'RULE',
        entityId: rule.id,
        field: 'conditions',
      });
    }

    // Required item references must resolve.
    const requiredNumbers = Array.isArray(rule.requiredItemNumbers)
      ? (rule.requiredItemNumbers as unknown[]).filter((n): n is string => typeof n === 'string')
      : [];
    const available = section
      ? itemNumbersBySection.get(section.id) ?? new Set<string>()
      : itemNumbersByVersion;
    for (const required of requiredNumbers) {
      if (!available.has(required)) {
        error({
          severity: 'ERROR',
          code: 'RULE_REQUIRED_ITEM_MISSING',
          message: `Required item "${required}" (${ruleLabel}) does not resolve to an evaluation item.`,
          entityType: 'RULE',
          entityId: rule.id,
          field: 'requiredItemNumbers',
        });
        break;
      }
    }
  }

  // -------------------------------------------------------------------------
  // Curriculum mappings
  // -------------------------------------------------------------------------
  for (const section of sections) {
    const links = section.curriculumUnitLinks;

    for (const link of links) {
      if (link.curriculumUnit.programmeId !== version.template.programmeId) {
        error({
          severity: 'ERROR',
          code: 'CROSS_PROGRAMME_MAPPING',
          message: `Curriculum unit "${link.curriculumUnit.name}" belongs to a different programme.`,
          entityType: 'MAPPING',
          entityId: link.curriculumUnitId,
          field: 'curriculumUnitId',
        });
      }
    }

    if (section.mappingStatus === 'MAPPED' && links.length === 0) {
      warn({
        severity: 'WARNING',
        code: 'MAPPED_WITHOUT_UNIT',
        message: 'Section is marked as mapped but no curriculum unit is linked.',
        entityType: 'SECTION',
        entityId: section.id,
        field: 'mappingStatus',
      });
    }
    if (section.mappingStatus === 'NOT_APPLICABLE' && links.length > 0) {
      warn({
        severity: 'WARNING',
        code: 'NOT_APPLICABLE_WITH_UNITS',
        message: 'Section is marked not applicable but still links curriculum units.',
        entityType: 'SECTION',
        entityId: section.id,
        field: 'mappingStatus',
      });
    }
    if (section.mappingStatus === 'UNMAPPED' && links.length > 0) {
      warn({
        severity: 'WARNING',
        code: 'UNMAPPED_WITH_UNITS',
        message: 'Section is marked unmapped but curriculum units are linked.',
        entityType: 'SECTION',
        entityId: section.id,
        field: 'mappingStatus',
      });
    }
  }

  const issues = [...errors, ...warnings];
  return {
    versionId,
    revision: version.revision,
    rulesetVersion: TEMPLATE_RULESET_VERSION,
    ok: errors.length === 0,
    errorCount: errors.length,
    warningCount: warnings.length,
    errors,
    warnings,
    issues,
  };
}

/**
 * Persist an immutable validation run (explicit validation or a publish
 * attempt). `revision` records the exact draft revision that was validated.
 */
export async function persistValidationRun(
  report: ValidationReport,
  actorId: string | null
) {
  return prisma.templateValidationRun.create({
    data: {
      versionId: report.versionId,
      revision: report.revision,
      rulesetVersion: report.rulesetVersion,
      status: report.ok ? 'PASSED' : 'FAILED',
      errorCount: report.errorCount,
      warningCount: report.warningCount,
      validatedById: actorId,
      issues: report.issues.length
        ? {
            create: report.issues.map((issue) => ({
              severity: issue.severity,
              code: issue.code,
              message: issue.message,
              entityType: issue.entityType ?? null,
              entityId: issue.entityId ?? null,
              field: issue.field ?? null,
            })),
          }
        : undefined,
    },
  });
}
