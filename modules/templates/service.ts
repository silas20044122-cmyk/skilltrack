import { Prisma, type TemplateVersionStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { AppError } from '@/lib/errors';
import { logAuditEvent } from '@/lib/audit/log-audit-event';
import type {
  CompetencyRuleCreateInput,
  CompetencyRuleUpdateInput,
  EvaluationItemCreateInput,
  EvaluationItemUpdateInput,
  SectionCreateInput,
  SectionMappingInput,
  SectionMoveInput,
  SectionUpdateInput,
  TemplateCreateInput,
  TemplateUpdateInput,
  VersionValidateInput,
} from '@/lib/validation/schemas';
import {
  persistValidationRun,
  validateTemplateDraft,
  type ValidationReport,
} from './validation';

/**
 * Mentoring template services (Sprint 4 editing + Sprint 5 lifecycle).
 *
 * Only `DRAFT` and `IN_REVIEW` versions are editable. Validation freezes a
 * version into `READY_FOR_PUBLISH`; `PUBLISHED` versions are immutable and a
 * change requires cloning a new draft. Nothing here publishes automatically.
 */

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function listProgrammeTemplates(programmeId: string) {
  return prisma.mentoringTemplate.findMany({
    where: { programmeId },
    orderBy: { createdAt: 'asc' },
    include: {
      versions: {
        orderBy: { versionNumber: 'desc' },
        select: {
          id: true,
          versionNumber: true,
          status: true,
          title: true,
          createdAt: true,
          validatedAt: true,
          publishedAt: true,
          _count: { select: { sections: true, warnings: true } },
        },
      },
    },
  });
}

export async function listTemplates(options: { programmeId?: string } = {}) {
  return prisma.mentoringTemplate.findMany({
    where: options.programmeId ? { programmeId: options.programmeId } : undefined,
    orderBy: [{ programme: { code: 'asc' } }, { createdAt: 'asc' }],
    include: {
      programme: { select: { id: true, name: true, code: true } },
      sourceDocument: { select: { id: true, fileName: true } },
      versions: {
        orderBy: { versionNumber: 'desc' },
        select: {
          id: true,
          versionNumber: true,
          status: true,
          createdAt: true,
          publishedAt: true,
          _count: { select: { sections: true } },
        },
      },
    },
  });
}

export async function getTemplateDetail(templateId: string) {
  return prisma.mentoringTemplate.findUnique({
    where: { id: templateId },
    include: {
      programme: { select: { id: true, name: true, code: true, status: true } },
      sourceDocument: { select: { id: true, fileName: true, status: true } },
      versions: {
        orderBy: { versionNumber: 'desc' },
        include: {
          sourceDocument: { select: { id: true, fileName: true } },
          basedOnVersion: { select: { id: true, versionNumber: true } },
          validatedBy: { select: { id: true, name: true } },
          publishedBy: { select: { id: true, name: true } },
          _count: { select: { sections: true, warnings: true, validationRuns: true } },
        },
      },
    },
  });
}

export async function getTemplateVersion(versionId: string) {
  return prisma.mentoringTemplateVersion.findUnique({
    where: { id: versionId },
    include: {
      template: {
        select: {
          id: true,
          programmeId: true,
          title: true,
          description: true,
          notes: true,
          programme: { select: { id: true, name: true, code: true } },
        },
      },
      sourceDocument: {
        select: { id: true, fileName: true, storageKey: true, status: true },
      },
      extractionRun: {
        select: { id: true, model: true, promptVersion: true, status: true, createdAt: true },
      },
      basedOnVersion: { select: { id: true, versionNumber: true } },
      validatedBy: { select: { id: true, name: true, email: true } },
      publishedBy: { select: { id: true, name: true, email: true } },
      warnings: { orderBy: { createdAt: 'asc' } },
      validationRuns: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          validatedBy: { select: { id: true, name: true } },
          issues: { orderBy: { createdAt: 'asc' } },
        },
      },
      sections: {
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        include: {
          evaluationItems: { orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }] },
          competencyRules: { orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }] },
          curriculumUnitLinks: {
            include: {
              curriculumUnit: { select: { id: true, code: true, name: true, status: true } },
            },
          },
        },
      },
      competencyRules: {
        where: { sectionId: null },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      },
    },
  });
}

export async function getLatestDraftForDocument(documentId: string) {
  return prisma.mentoringTemplateVersion.findFirst({
    where: { sourceDocumentId: documentId, status: 'DRAFT' },
    orderBy: { versionNumber: 'desc' },
    select: { id: true, versionNumber: true },
  });
}

// -------------------------------------------------------------------------
// Template authoring
// -------------------------------------------------------------------------

export async function createTemplate(input: TemplateCreateInput, actorId: string) {
  const programme = await prisma.programme.findUnique({
    where: { id: input.programmeId },
    select: { id: true },
  });
  if (!programme) {
    throw new AppError('Select a valid programme.', 'INVALID_REFERENCE', {
      programmeId: ['Select a valid programme.'],
    });
  }

  const template = await prisma.mentoringTemplate.create({
    data: {
      programmeId: input.programmeId,
      title: input.title,
      description: input.description ?? null,
      versions: {
        create: { versionNumber: 1, status: 'DRAFT', title: input.title },
      },
    },
    include: { versions: true },
  });

  logAuditEvent({
    action: 'TEMPLATE_CREATED',
    actorId,
    targetType: 'MentoringTemplate',
    targetId: template.id,
    metadata: { programmeId: input.programmeId, versionId: template.versions[0]?.id },
  });

  return template;
}

export async function updateTemplate(
  templateId: string,
  input: TemplateUpdateInput,
  actorId: string
) {
  const template = await prisma.mentoringTemplate.findUnique({
    where: { id: templateId },
    select: { id: true },
  });
  if (!template) throw new AppError('The template could not be found.', 'NOT_FOUND');

  const updated = await prisma.mentoringTemplate.update({
    where: { id: templateId },
    data: { title: input.title, description: input.description ?? null },
  });

  logAuditEvent({
    action: 'TEMPLATE_UPDATED',
    actorId,
    targetType: 'MentoringTemplate',
    targetId: templateId,
    metadata: { title: updated.title },
  });

  return updated;
}

// -------------------------------------------------------------------------
// Consumption (contract for future assessment services)
// -------------------------------------------------------------------------

/**
 * The current published version for a template. At most one version per
 * template is `PUBLISHED` (publishing archives the previous one), so selecting
 * the highest published version number is deterministic.
 */
export async function getCurrentPublishedVersion(templateId: string) {
  return prisma.mentoringTemplateVersion.findFirst({
    where: { templateId, status: 'PUBLISHED' },
    orderBy: { versionNumber: 'desc' },
    select: {
      id: true,
      versionNumber: true,
      title: true,
      publishedAt: true,
      publishedBy: { select: { id: true, name: true } },
    },
  });
}

export async function getPublishedTemplatesForProgramme(programmeId: string) {
  const templates = await prisma.mentoringTemplate.findMany({
    where: { programmeId },
    orderBy: { createdAt: 'asc' },
    include: {
      programme: { select: { id: true, name: true, code: true } },
      versions: {
        where: { status: 'PUBLISHED' },
        orderBy: { versionNumber: 'desc' },
        take: 1,
        select: {
          id: true,
          versionNumber: true,
          title: true,
          publishedAt: true,
          _count: { select: { sections: true } },
        },
      },
    },
  });

  return templates.map((template) => ({
    template,
    currentPublishedVersion: template.versions[0] ?? null,
  }));
}

/**
 * Return the full published structure for an exact version. Draft content is
 * never served by default; consumers must reference a published version.
 */
export async function getPublishedTemplateStructure(versionId: string) {
  const version = await getTemplateVersion(versionId);
  if (!version) throw new AppError('The template version could not be found.', 'NOT_FOUND');
  if (version.status !== 'PUBLISHED') {
    throw new AppError(
      'Only published template versions can be consumed. This version is not published.',
      'INVALID_STATE'
    );
  }
  return version;
}

// -------------------------------------------------------------------------
// Editing
// -------------------------------------------------------------------------

async function bumpRevisionFor(versionId: string) {
  await prisma.mentoringTemplateVersion.update({
    where: { id: versionId },
    data: { revision: { increment: 1 } },
  });
}

async function assertEditable(versionId: string) {
  const version = await prisma.mentoringTemplateVersion.findUnique({
    where: { id: versionId },
    select: { id: true, status: true },
  });
  if (!version) throw new AppError('The template version could not be found.', 'NOT_FOUND');
  if (version.status !== 'DRAFT' && version.status !== 'IN_REVIEW') {
    throw new AppError(
      'This template version can no longer be edited. Return it to draft or create a new draft.',
      'INVALID_STATE'
    );
  }
  return version;
}

export async function updateSection(
  sectionId: string,
  input: SectionUpdateInput,
  actorId: string
) {
  const section = await prisma.templateSection.findUnique({ where: { id: sectionId } });
  if (!section) throw new AppError('The section could not be found.', 'NOT_FOUND');
  await assertEditable(section.versionId);

  const updated = await prisma.templateSection.update({
    where: { id: sectionId },
    data: {
      title: input.title,
      sectionNumber: input.sectionNumber ?? null,
      description: input.description ?? null,
      sectionType: input.sectionType ?? null,
      mappingStatus: input.mappingStatus,
    },
  });
  await bumpRevisionFor(section.versionId);
  logAuditEvent({
    action: 'TEMPLATE_DATA_EDITED',
    actorId,
    targetType: 'TemplateSection',
    targetId: updated.id,
    metadata: { versionId: section.versionId },
  });
  return updated;
}

export async function getVersionIdForSection(sectionId: string) {
  const section = await prisma.templateSection.findUnique({
    where: { id: sectionId },
    select: { versionId: true },
  });
  return section?.versionId ?? null;
}

export async function createSection(input: SectionCreateInput, actorId: string) {
  await assertEditable(input.versionId);

  if (input.parentSectionId) {
    const parent = await prisma.templateSection.findUnique({
      where: { id: input.parentSectionId },
      select: { versionId: true },
    });
    if (!parent || parent.versionId !== input.versionId) {
      throw new AppError('The selected parent section is invalid.', 'INVALID_REFERENCE', {
        parentSectionId: ['Select a parent section within the same version.'],
      });
    }
  }

  const last = await prisma.templateSection.findFirst({
    where: { versionId: input.versionId },
    orderBy: { displayOrder: 'desc' },
    select: { displayOrder: true },
  });

  const created = await prisma.templateSection.create({
    data: {
      versionId: input.versionId,
      title: input.title,
      sectionNumber: input.sectionNumber ?? null,
      description: input.description ?? null,
      sectionType: input.sectionType ?? null,
      mappingStatus: input.mappingStatus,
      parentSectionId: input.parentSectionId ?? null,
      displayOrder: input.displayOrder ?? (last?.displayOrder ?? -1) + 1,
    },
  });
  await bumpRevisionFor(input.versionId);
  logAuditEvent({
    action: 'TEMPLATE_SECTION_CREATED',
    actorId,
    targetType: 'TemplateSection',
    targetId: created.id,
    metadata: { versionId: input.versionId },
  });
  return created;
}

async function collectSubtree(versionId: string, rootId: string): Promise<string[]> {
  const sections = await prisma.templateSection.findMany({
    where: { versionId },
    select: { id: true, parentSectionId: true },
  });
  const childrenByParent = new Map<string, string[]>();
  for (const section of sections) {
    if (!section.parentSectionId) continue;
    const list = childrenByParent.get(section.parentSectionId) ?? [];
    list.push(section.id);
    childrenByParent.set(section.parentSectionId, list);
  }
  const ids: string[] = [];
  const stack = [rootId];
  while (stack.length) {
    const current = stack.pop()!;
    ids.push(current);
    for (const child of childrenByParent.get(current) ?? []) stack.push(child);
  }
  return ids;
}

export async function deleteSection(sectionId: string, actorId: string) {
  const section = await prisma.templateSection.findUnique({
    where: { id: sectionId },
    select: { id: true, versionId: true },
  });
  if (!section) throw new AppError('The section could not be found.', 'NOT_FOUND');
  await assertEditable(section.versionId);

  const ids = await collectSubtree(section.versionId, section.id);
  await prisma.templateSection.deleteMany({ where: { id: { in: ids } } });
  await bumpRevisionFor(section.versionId);

  logAuditEvent({
    action: 'TEMPLATE_SECTION_DELETED',
    actorId,
    targetType: 'TemplateSection',
    targetId: section.id,
    metadata: { versionId: section.versionId, deleted: ids.length },
  });
}

export async function moveSection(input: SectionMoveInput, actorId: string) {
  const section = await prisma.templateSection.findUnique({
    where: { id: input.sectionId },
    select: { id: true, versionId: true },
  });
  if (!section) throw new AppError('The section could not be found.', 'NOT_FOUND');
  await assertEditable(section.versionId);

  if (input.parentSectionId) {
    if (input.parentSectionId === section.id) {
      throw new AppError('A section cannot be its own parent.', 'INVALID_STATE');
    }
    const parent = await prisma.templateSection.findUnique({
      where: { id: input.parentSectionId },
      select: { versionId: true },
    });
    if (!parent || parent.versionId !== section.versionId) {
      throw new AppError('The selected parent section is invalid.', 'INVALID_REFERENCE');
    }
    const subtree = new Set(await collectSubtree(section.versionId, section.id));
    if (subtree.has(input.parentSectionId)) {
      throw new AppError('A section cannot be moved under one of its descendants.', 'INVALID_STATE');
    }
  }

  const updated = await prisma.templateSection.update({
    where: { id: section.id },
    data: {
      parentSectionId: input.parentSectionId ?? null,
      ...(input.displayOrder !== undefined ? { displayOrder: input.displayOrder } : {}),
    },
  });
  await bumpRevisionFor(section.versionId);
  logAuditEvent({
    action: 'TEMPLATE_DATA_EDITED',
    actorId,
    targetType: 'TemplateSection',
    targetId: section.id,
    metadata: { versionId: section.versionId, moved: true },
  });
  return updated;
}

export async function updateEvaluationItem(
  itemId: string,
  input: EvaluationItemUpdateInput,
  actorId: string
) {
  const item = await prisma.evaluationItem.findUnique({
    where: { id: itemId },
    include: { section: { select: { versionId: true } } },
  });
  if (!item) throw new AppError('The evaluation item could not be found.', 'NOT_FOUND');
  await assertEditable(item.section.versionId);

  const updated = await prisma.evaluationItem.update({
    where: { id: itemId },
    data: {
      description: input.description,
      itemNumber: input.itemNumber ?? null,
      category: input.category,
      sourceWording: input.sourceWording ?? null,
      notes: input.notes ?? null,
    },
  });
  await bumpRevisionFor(item.section.versionId);
  logAuditEvent({
    action: 'TEMPLATE_DATA_EDITED',
    actorId,
    targetType: 'EvaluationItem',
    targetId: updated.id,
    metadata: { versionId: item.section.versionId },
  });
  return updated;
}

export async function createEvaluationItem(input: EvaluationItemCreateInput, actorId: string) {
  const section = await prisma.templateSection.findUnique({
    where: { id: input.sectionId },
    select: { id: true, versionId: true },
  });
  if (!section) throw new AppError('The section could not be found.', 'NOT_FOUND');
  await assertEditable(section.versionId);

  const last = await prisma.evaluationItem.findFirst({
    where: { sectionId: section.id },
    orderBy: { displayOrder: 'desc' },
    select: { displayOrder: true },
  });

  const created = await prisma.evaluationItem.create({
    data: {
      sectionId: section.id,
      description: input.description,
      itemNumber: input.itemNumber ?? null,
      category: input.category,
      sourceWording: input.sourceWording ?? null,
      notes: input.notes ?? null,
      displayOrder: input.displayOrder ?? (last?.displayOrder ?? -1) + 1,
    },
  });
  await bumpRevisionFor(section.versionId);
  logAuditEvent({
    action: 'TEMPLATE_ITEM_CREATED',
    actorId,
    targetType: 'EvaluationItem',
    targetId: created.id,
    metadata: { versionId: section.versionId, sectionId: section.id },
  });
  return created;
}

export async function deleteEvaluationItem(itemId: string, actorId: string) {
  const item = await prisma.evaluationItem.findUnique({
    where: { id: itemId },
    include: { section: { select: { versionId: true } } },
  });
  if (!item) throw new AppError('The evaluation item could not be found.', 'NOT_FOUND');
  await assertEditable(item.section.versionId);

  await prisma.evaluationItem.delete({ where: { id: itemId } });
  await bumpRevisionFor(item.section.versionId);
  logAuditEvent({
    action: 'TEMPLATE_ITEM_DELETED',
    actorId,
    targetType: 'EvaluationItem',
    targetId: itemId,
    metadata: { versionId: item.section.versionId },
  });
}

export async function updateCompetencyRule(
  ruleId: string,
  input: CompetencyRuleUpdateInput,
  actorId: string
) {
  const rule = await prisma.competencyRule.findUnique({ where: { id: ruleId } });
  if (!rule) throw new AppError('The competency rule could not be found.', 'NOT_FOUND');
  await assertEditable(rule.versionId);

  const requiredItemNumbers = input.requiredItemNumbers
    ? input.requiredItemNumbers
        .split(/[,\n]/)
        .map((value) => value.trim())
        .filter(Boolean)
    : [];

  const updated = await prisma.competencyRule.update({
    where: { id: ruleId },
    data: {
      ruleType: input.ruleType,
      minimumCorrect: input.minimumCorrect ?? null,
      minimumPercentage: input.minimumPercentage ?? null,
      requiredItemNumbers: requiredItemNumbers as Prisma.InputJsonValue,
      sourceWording: input.sourceWording,
      notes: input.notes ?? null,
    },
  });
  await bumpRevisionFor(rule.versionId);
  logAuditEvent({
    action: 'TEMPLATE_DATA_EDITED',
    actorId,
    targetType: 'CompetencyRule',
    targetId: updated.id,
    metadata: { versionId: rule.versionId },
  });
  return updated;
}

export async function createCompetencyRule(input: CompetencyRuleCreateInput, actorId: string) {
  await assertEditable(input.versionId);

  if (input.sectionId) {
    const section = await prisma.templateSection.findUnique({
      where: { id: input.sectionId },
      select: { versionId: true },
    });
    if (!section || section.versionId !== input.versionId) {
      throw new AppError('The selected section is invalid.', 'INVALID_REFERENCE');
    }
  }

  const requiredItemNumbers = input.requiredItemNumbers
    ? input.requiredItemNumbers
        .split(/[,\n]/)
        .map((value) => value.trim())
        .filter(Boolean)
    : [];

  const last = await prisma.competencyRule.findFirst({
    where: { versionId: input.versionId, sectionId: input.sectionId ?? null },
    orderBy: { displayOrder: 'desc' },
    select: { displayOrder: true },
  });

  const created = await prisma.competencyRule.create({
    data: {
      versionId: input.versionId,
      sectionId: input.sectionId ?? null,
      ruleType: input.ruleType,
      minimumCorrect: input.minimumCorrect ?? null,
      minimumPercentage: input.minimumPercentage ?? null,
      requiredItemNumbers: requiredItemNumbers as Prisma.InputJsonValue,
      sourceWording: input.sourceWording,
      notes: input.notes ?? null,
      displayOrder: (last?.displayOrder ?? -1) + 1,
    },
  });
  await bumpRevisionFor(input.versionId);
  logAuditEvent({
    action: 'TEMPLATE_RULE_CREATED',
    actorId,
    targetType: 'CompetencyRule',
    targetId: created.id,
    metadata: { versionId: input.versionId, sectionId: input.sectionId ?? null },
  });
  return created;
}

export async function deleteCompetencyRule(ruleId: string, actorId: string) {
  const rule = await prisma.competencyRule.findUnique({ where: { id: ruleId } });
  if (!rule) throw new AppError('The competency rule could not be found.', 'NOT_FOUND');
  await assertEditable(rule.versionId);

  await prisma.competencyRule.delete({ where: { id: ruleId } });
  await bumpRevisionFor(rule.versionId);
  logAuditEvent({
    action: 'TEMPLATE_RULE_DELETED',
    actorId,
    targetType: 'CompetencyRule',
    targetId: ruleId,
    metadata: { versionId: rule.versionId },
  });
}

export async function setSectionMapping(input: SectionMappingInput, actorId: string) {
  const section = await prisma.templateSection.findUnique({
    where: { id: input.sectionId },
    select: { id: true, versionId: true },
  });
  if (!section) throw new AppError('The section could not be found.', 'NOT_FOUND');
  await assertEditable(section.versionId);

  // Only units of the same programme may be linked.
  if (input.unitIds.length > 0) {
    const version = await prisma.mentoringTemplateVersion.findUnique({
      where: { id: section.versionId },
      select: { template: { select: { programmeId: true } } },
    });
    const programmeId = version?.template.programmeId;
    const valid = await prisma.curriculumUnit.count({
      where: { id: { in: input.unitIds }, programmeId },
    });
    if (valid !== input.unitIds.length) {
      throw new AppError('One or more curriculum units are invalid.', 'INVALID_REFERENCE');
    }
  }

  await prisma.$transaction([
    prisma.templateSectionCurriculumUnit.deleteMany({
      where: { sectionId: section.id },
    }),
    prisma.templateSectionCurriculumUnit.createMany({
      data: input.unitIds.map((curriculumUnitId) => ({
        sectionId: section.id,
        curriculumUnitId,
      })),
      skipDuplicates: true,
    }),
    prisma.templateSection.update({
      where: { id: section.id },
      data: { mappingStatus: input.mappingStatus },
    }),
  ]);

  await bumpRevisionFor(section.versionId);

  logAuditEvent({
    action: 'CURRICULUM_MAPPING_CHANGED',
    actorId,
    targetType: 'TemplateSection',
    targetId: section.id,
    metadata: { versionId: section.versionId, unitIds: input.unitIds },
  });
}

// -------------------------------------------------------------------------
// Lifecycle
// -------------------------------------------------------------------------

const TRANSITION_TARGETS: Record<string, TemplateVersionStatus[]> = {
  DRAFT: ['IN_REVIEW'],
  IN_REVIEW: ['DRAFT', 'READY_FOR_PUBLISH'],
  READY_FOR_PUBLISH: ['DRAFT', 'IN_REVIEW'],
  PUBLISHED: ['ARCHIVED'],
  ARCHIVED: [],
};

export async function transitionTemplateVersion(
  versionId: string,
  to: TemplateVersionStatus,
  actorId: string
) {
  const version = await prisma.mentoringTemplateVersion.findUnique({
    where: { id: versionId },
    select: { id: true, status: true, sourceDocumentId: true, templateId: true },
  });
  if (!version) throw new AppError('The template version could not be found.', 'NOT_FOUND');

  if (to === 'PUBLISHED') {
    throw new AppError(
      'Use the publish action to publish a version; it re-runs validation first.',
      'INVALID_STATE'
    );
  }

  const allowed = TRANSITION_TARGETS[version.status] ?? [];
  if (!allowed.includes(to)) {
    throw new AppError(
      `A ${version.status.replace(/_/g, ' ')} version cannot move to ${to.replace(/_/g, ' ')}.`,
      'INVALID_STATE'
    );
  }

  const data: Prisma.MentoringTemplateVersionUpdateInput = { status: to };
  if (to === 'ARCHIVED') data.archivedAt = new Date();

  const updated = await prisma.mentoringTemplateVersion.update({
    where: { id: version.id },
    data,
  });

  logAuditEvent({
    action: to === 'ARCHIVED' ? 'TEMPLATE_VERSION_ARCHIVED' : 'TEMPLATE_VERSION_TRANSITIONED',
    actorId,
    targetType: 'MentoringTemplateVersion',
    targetId: updated.id,
    metadata: { from: version.status, to },
  });

  return updated;
}

/**
 * Run validation and persist an immutable run record. Safe to call repeatedly.
 */
export async function runTemplateValidation(
  versionId: string,
  actorId: string
): Promise<ValidationReport> {
  const report = await validateTemplateDraft(versionId);
  await persistValidationRun(report, actorId);
  logAuditEvent({
    action: report.ok ? 'TEMPLATE_VALIDATED' : 'TEMPLATE_VALIDATION_FAILED',
    actorId,
    targetType: 'MentoringTemplateVersion',
    targetId: versionId,
    metadata: {
      rulesetVersion: report.rulesetVersion,
      revision: report.revision,
      errors: report.errorCount,
      warnings: report.warningCount,
    },
  });
  return report;
}

/**
 * Validate and, when the draft is clean, transition it to READY_FOR_PUBLISH.
 * A failed validation is persisted and blocks the transition.
 */
export async function markReadyForPublish(input: VersionValidateInput, actorId: string) {
  const version = await prisma.mentoringTemplateVersion.findUnique({
    where: { id: input.versionId },
    select: { id: true, status: true, templateId: true, sourceDocumentId: true },
  });
  if (!version) throw new AppError('The template version could not be found.', 'NOT_FOUND');
  if (version.status !== 'DRAFT' && version.status !== 'IN_REVIEW') {
    throw new AppError('Only draft or in-review versions can be marked ready for publication.', 'INVALID_STATE');
  }

  const report = await runTemplateValidation(version.id, actorId);
  if (!report.ok) {
    throw new AppError(
      `Validation found ${report.errorCount} blocking issue(s). Resolve them before marking ready for publication.`,
      'INVALID_STATE',
      Object.fromEntries(
        report.errors.slice(0, 10).map((issue) => [
          issue.entityId ?? issue.field ?? 'validation',
          [issue.message],
        ])
      )
    );
  }

  const updated = await prisma.mentoringTemplateVersion.update({
    where: { id: version.id },
    data: {
      status: 'READY_FOR_PUBLISH',
      validatedById: actorId,
      validatedAt: new Date(),
      notes: input.notes ?? null,
    },
  });

  if (version.sourceDocumentId) {
    await prisma.sourceDocument.update({
      where: { id: version.sourceDocumentId },
      data: { status: 'VALIDATED' },
    });
  }

  logAuditEvent({
    action: 'TEMPLATE_READY_FOR_PUBLISH',
    actorId,
    targetType: 'MentoringTemplateVersion',
    targetId: updated.id,
    metadata: { sourceDocumentId: version.sourceDocumentId, revision: report.revision },
  });

  return updated;
}
