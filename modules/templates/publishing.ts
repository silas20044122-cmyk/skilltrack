import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { AppError } from '@/lib/errors';
import { logAuditEvent } from '@/lib/audit/log-audit-event';
import { persistValidationRun, validateTemplateDraft } from './validation';

/**
 * Sprint 5 — publishing and version management.
 *
 * Publishing is transactional and re-runs validation against the *current*
 * draft immediately before persisting, so an earlier passing result is never
 * trusted. A version becomes PUBLISHED in place and is thereafter immutable;
 * any other PUBLISHED version of the same template is archived so that exactly
 * one published version is current. Cloning produces independent DRAFT rows.
 */

const MAX_TX_RETRIES = 4;

async function withSerializableRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_TX_RETRIES; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const code =
        error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined;
      // P2034: write conflict / deadlock. P2002 on (templateId, versionNumber).
      if (code === 'P2034' || code === 'P2002') continue;
      throw error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new AppError('The operation could not be completed due to a concurrent change.', 'CONFLICT');
}

export async function publishTemplateVersion(versionId: string, actorId: string) {
  const version = await prisma.mentoringTemplateVersion.findUnique({
    where: { id: versionId },
    select: { id: true, templateId: true, status: true, versionNumber: true, title: true },
  });
  if (!version) throw new AppError('The template version could not be found.', 'NOT_FOUND');
  if (version.status !== 'READY_FOR_PUBLISH') {
    throw new AppError(
      'Only a version marked ready for publication can be published.',
      'INVALID_STATE'
    );
  }

  // Re-run validation against the current draft and persist the attempt.
  const report = await validateTemplateDraft(versionId);
  await persistValidationRun(report, actorId);

  if (!report.ok) {
    logAuditEvent({
      action: 'TEMPLATE_VALIDATION_FAILED',
      actorId,
      targetType: 'MentoringTemplateVersion',
      targetId: versionId,
      metadata: {
        stage: 'publish',
        rulesetVersion: report.rulesetVersion,
        revision: report.revision,
        errors: report.errorCount,
      },
    });
    throw new AppError(
      `Publication blocked: validation found ${report.errorCount} issue(s).`,
      'INVALID_STATE',
      Object.fromEntries(
        report.errors.slice(0, 10).map((issue) => [
          issue.entityId ?? issue.field ?? 'validation',
          [issue.message],
        ])
      )
    );
  }

  const published = await withSerializableRetry(() =>
    prisma.$transaction(async (tx) => {
      // Atomic conditional transition: protects against duplicate submissions
      // and concurrent publication of the same draft.
      const result = await tx.mentoringTemplateVersion.updateMany({
        where: { id: versionId, status: 'READY_FOR_PUBLISH' },
        data: { status: 'PUBLISHED', publishedAt: new Date(), publishedById: actorId },
      });
      if (result.count !== 1) {
        throw new AppError(
          'This version is no longer ready to publish (it may already have been published).',
          'INVALID_STATE'
        );
      }

      // Retire the previous published version, preserving its history.
      await tx.mentoringTemplateVersion.updateMany({
        where: {
          templateId: version.templateId,
          status: 'PUBLISHED',
          id: { not: versionId },
        },
        data: { status: 'ARCHIVED', archivedAt: new Date() },
      });

      return tx.mentoringTemplateVersion.findUniqueOrThrow({
        where: { id: versionId },
        select: {
          id: true,
          versionNumber: true,
          title: true,
          publishedAt: true,
          publishedBy: { select: { id: true, name: true } },
        },
      });
    }, { isolationLevel: 'Serializable' })
  );

  logAuditEvent({
    action: 'TEMPLATE_VERSION_PUBLISHED',
    actorId,
    targetType: 'MentoringTemplateVersion',
    targetId: versionId,
    metadata: {
      templateId: version.templateId,
      versionNumber: version.versionNumber,
      rulesetVersion: report.rulesetVersion,
      revision: report.revision,
    },
  });

  return { version: published, report };
}

export async function createDraftFromVersion(sourceVersionId: string, actorId: string) {
  const source = await prisma.mentoringTemplateVersion.findUnique({
    where: { id: sourceVersionId },
    include: {
      sections: {
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        include: {
          evaluationItems: { orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }] },
          competencyRules: { orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }] },
          curriculumUnitLinks: true,
        },
      },
      competencyRules: { where: { sectionId: null } },
    },
  });
  if (!source) throw new AppError('The source version could not be found.', 'NOT_FOUND');

  const draft = await withSerializableRetry(() =>
    prisma.$transaction(async (tx) => {
    const last = await tx.mentoringTemplateVersion.findFirst({
      where: { templateId: source.templateId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });
    const versionNumber = (last?.versionNumber ?? 0) + 1;

    const created = await tx.mentoringTemplateVersion.create({
      data: {
        templateId: source.templateId,
        versionNumber,
        status: 'DRAFT',
        title: source.title,
        sourceDocumentId: source.sourceDocumentId,
        basedOnVersionId: source.id,
        revision: 1,
      },
    });

    const sectionIdMap = new Map<string, string>();
    for (const section of source.sections) {
      const newSection = await tx.templateSection.create({
        data: {
          versionId: created.id,
          sectionNumber: section.sectionNumber,
          title: section.title,
          description: section.description,
          sectionType: section.sectionType,
          displayOrder: section.displayOrder,
          mappingStatus: section.mappingStatus,
          notes: section.notes,
          evaluationItems: {
            create: section.evaluationItems.map((item) => ({
              itemNumber: item.itemNumber,
              description: item.description,
              sourceWording: item.sourceWording,
              category: item.category,
              displayOrder: item.displayOrder,
              sourceLocation: item.sourceLocation,
              notes: item.notes,
            })),
          },
          curriculumUnitLinks: {
            create: section.curriculumUnitLinks.map((link) => ({
              curriculumUnitId: link.curriculumUnitId,
            })),
          },
        },
      });
      sectionIdMap.set(section.id, newSection.id);

      for (const rule of section.competencyRules) {
        await tx.competencyRule.create({
          data: {
            versionId: created.id,
            sectionId: newSection.id,
            ruleType: rule.ruleType,
            minimumCorrect: rule.minimumCorrect,
            minimumPercentage: rule.minimumPercentage,
            requiredItemNumbers: (rule.requiredItemNumbers ?? undefined) as Prisma.InputJsonValue,
            conditions: (rule.conditions ?? undefined) as Prisma.InputJsonValue,
            sourceWording: rule.sourceWording,
            notes: rule.notes,
            displayOrder: rule.displayOrder,
          },
        });
      }
    }

    // Re-link parents now that every section has a new id.
    for (const section of source.sections) {
      if (!section.parentSectionId) continue;
      const newId = sectionIdMap.get(section.id);
      const newParentId = sectionIdMap.get(section.parentSectionId);
      if (newId && newParentId) {
        await tx.templateSection.update({
          where: { id: newId },
          data: { parentSectionId: newParentId },
        });
      }
    }

    for (const rule of source.competencyRules) {
      await tx.competencyRule.create({
        data: {
          versionId: created.id,
          sectionId: null,
          ruleType: rule.ruleType,
          minimumCorrect: rule.minimumCorrect,
          minimumPercentage: rule.minimumPercentage,
          requiredItemNumbers: (rule.requiredItemNumbers ?? undefined) as Prisma.InputJsonValue,
          conditions: (rule.conditions ?? undefined) as Prisma.InputJsonValue,
          sourceWording: rule.sourceWording,
          notes: rule.notes,
          displayOrder: rule.displayOrder,
        },
      });
    }

      return created;
    }, { isolationLevel: 'Serializable' })
  );

  logAuditEvent({
    action: 'TEMPLATE_DRAFT_CLONED',
    actorId,
    targetType: 'MentoringTemplateVersion',
    targetId: draft.id,
    metadata: {
      templateId: source.templateId,
      basedOnVersionId: source.id,
      versionNumber: draft.versionNumber,
    },
  });

  return draft;
}
