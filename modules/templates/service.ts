import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { AppError } from '@/lib/errors';
import { logAuditEvent } from '@/lib/audit/log-audit-event';
import type {
  CompetencyRuleUpdateInput,
  EvaluationItemUpdateInput,
  SectionMappingInput,
  SectionUpdateInput,
  VersionValidateInput,
} from '@/lib/validation/schemas';

/**
 * Mentoring template services.
 *
 * Only `EXTRACTION_DRAFT` versions are editable. Validation freezes a version
 * into a reviewable `VALIDATED` definition that Sprint 5 will be able to
 * publish; nothing here publishes automatically.
 */

const EDITABLE: ReadonlySet<string> = new Set(['EXTRACTION_DRAFT']);

async function assertEditableVersion(versionId: string) {
  const version = await prisma.mentoringTemplateVersion.findUnique({
    where: { id: versionId },
    select: { id: true, status: true },
  });
  if (!version) throw new AppError('The template version could not be found.', 'NOT_FOUND');
  if (!EDITABLE.has(version.status)) {
    throw new AppError(
      'This template version has been validated and can no longer be edited.',
      'INVALID_STATE'
    );
  }
  return version;
}

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
          _count: { select: { sections: true, warnings: true } },
        },
      },
    },
  });
}

export async function getTemplateVersion(versionId: string) {
  return prisma.mentoringTemplateVersion.findUnique({
    where: { id: versionId },
    include: {
      template: { select: { id: true, programmeId: true, title: true } },
      sourceDocument: {
        select: { id: true, fileName: true, storageKey: true, status: true },
      },
      extractionRun: {
        select: { id: true, model: true, promptVersion: true, status: true, createdAt: true },
      },
      validatedBy: { select: { id: true, name: true, email: true } },
      warnings: { orderBy: { createdAt: 'asc' } },
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
    where: { sourceDocumentId: documentId, status: 'EXTRACTION_DRAFT' },
    orderBy: { versionNumber: 'desc' },
    select: { id: true, versionNumber: true },
  });
}

export async function updateSection(
  sectionId: string,
  input: SectionUpdateInput,
  actorId: string
) {
  const section = await prisma.templateSection.findUnique({ where: { id: sectionId } });
  if (!section) throw new AppError('The section could not be found.', 'NOT_FOUND');
  await assertEditableVersion(section.versionId);

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
  logAuditEvent({
    action: 'TEMPLATE_DATA_EDITED',
    actorId,
    targetType: 'TemplateSection',
    targetId: updated.id,
    metadata: { versionId: section.versionId },
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
  await assertEditableVersion(item.section.versionId);

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
  logAuditEvent({
    action: 'TEMPLATE_DATA_EDITED',
    actorId,
    targetType: 'EvaluationItem',
    targetId: updated.id,
    metadata: { versionId: item.section.versionId },
  });
  return updated;
}

export async function updateCompetencyRule(
  ruleId: string,
  input: CompetencyRuleUpdateInput,
  actorId: string
) {
  const rule = await prisma.competencyRule.findUnique({ where: { id: ruleId } });
  if (!rule) throw new AppError('The competency rule could not be found.', 'NOT_FOUND');
  await assertEditableVersion(rule.versionId);

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
  logAuditEvent({
    action: 'TEMPLATE_DATA_EDITED',
    actorId,
    targetType: 'CompetencyRule',
    targetId: updated.id,
    metadata: { versionId: rule.versionId },
  });
  return updated;
}

export async function setSectionMapping(
  input: SectionMappingInput,
  actorId: string
) {
  const section = await prisma.templateSection.findUnique({
    where: { id: input.sectionId },
    select: { id: true, versionId: true },
  });
  if (!section) throw new AppError('The section could not be found.', 'NOT_FOUND');
  await assertEditableVersion(section.versionId);

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

  logAuditEvent({
    action: 'CURRICULUM_MAPPING_CHANGED',
    actorId,
    targetType: 'TemplateSection',
    targetId: section.id,
    metadata: { versionId: section.versionId, unitIds: input.unitIds },
  });
}

export async function validateTemplateVersion(
  input: VersionValidateInput,
  actorId: string
) {
  const version = await prisma.mentoringTemplateVersion.findUnique({
    where: { id: input.versionId },
    include: { _count: { select: { sections: true } } },
  });
  if (!version) throw new AppError('The template version could not be found.', 'NOT_FOUND');
  if (version.status !== 'EXTRACTION_DRAFT') {
    throw new AppError('Only draft versions can be validated.', 'INVALID_STATE');
  }
  if (version._count.sections === 0) {
    throw new AppError(
      'A template version must contain at least one section before it can be validated.',
      'INVALID_STATE'
    );
  }

  const updated = await prisma.mentoringTemplateVersion.update({
    where: { id: version.id },
    data: {
      status: 'VALIDATED',
      validatedById: actorId,
      validatedAt: new Date(),
      notes: input.notes ?? version.notes ?? null,
    },
  });

  if (version.sourceDocumentId) {
    await prisma.sourceDocument.update({
      where: { id: version.sourceDocumentId },
      data: { status: 'VALIDATED' },
    });
  }

  logAuditEvent({
    action: 'EXTRACTION_VALIDATED',
    actorId,
    targetType: 'MentoringTemplateVersion',
    targetId: updated.id,
    metadata: { sourceDocumentId: version.sourceDocumentId },
  });

  return updated;
}
