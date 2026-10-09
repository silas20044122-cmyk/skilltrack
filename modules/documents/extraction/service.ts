import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { AppError } from '@/lib/errors';
import { logAuditEvent } from '@/lib/audit/log-audit-event';
import { storage } from '@/lib/storage';
import {
  collectExtractionWarnings,
  extractionResultSchema,
  type ExtractionResult,
} from '@/lib/validation/extraction';
import { runGeminiExtraction, getGeminiModel } from './gemini';
import {
  buildExtractionPrompt,
  EXTRACTION_SYSTEM_INSTRUCTION,
  PROMPT_VERSION,
} from './prompt';

/**
 * Extraction orchestration.
 *
 * Flow: source PDF (object storage) → Gemini → raw response (persisted
 * verbatim) → JSON parse → schema validation → DRAFT version with sections,
 * items, rules and warnings. Nothing is ever auto-published: the draft always
 * requires human review and validation.
 *
 * Each uploaded PDF owns exactly one template (keyed by `sourceDocumentId`), so
 * uploading a second PDF produces a second independent template rather than a
 * new version. Re-extracting the *same* document adds a new numbered draft to
 * that document's existing template.
 */

function parseJsonResponse(raw: string): unknown {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

function normalize(value: string | null | undefined): string {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

type ExtractableDocument = {
  id: string;
  storageKey: string;
  programmeId: string;
  programme: { id: string; name: string };
};

/**
 * Conservative, configuration-driven auto-mapping: a section is linked to a
 * curriculum unit only when the seeded unit code matches the section number or
 * the unit name matches the section title. Anything else is left UNMAPPED for
 * an administrator to decide. This never invents mappings.
 */
function matchUnits(
  section: ExtractionResult['sections'][number],
  units: Array<{ id: string; code: string; name: string }>
): string[] {
  const byNumber = normalize(section.sectionNumber);
  const byTitle = normalize(section.title);
  return units
    .filter((unit) => {
      const code = normalize(unit.code);
      const name = normalize(unit.name);
      return (
        (byNumber.length > 0 && code === byNumber) ||
        (byTitle.length > 0 && name === byTitle)
      );
    })
    .map((unit) => unit.id);
}

/**
 * Fast, synchronous half of extraction: resolves the document, records the
 * PROCESSING run and flips the document status. Returns immediately so the
 * caller can schedule the slow Gemini work with `after()`.
 */
export async function beginExtraction(
  documentId: string,
  actorId: string
): Promise<{ document: ExtractableDocument; runId: string }> {
  const document = await prisma.sourceDocument.findUnique({
    where: { id: documentId },
    include: { programme: { select: { id: true, name: true } } },
  });
  if (!document) throw new AppError('The document could not be found.', 'NOT_FOUND');

  logAuditEvent({
    action: 'EXTRACTION_STARTED',
    actorId,
    targetType: 'SourceDocument',
    targetId: document.id,
    metadata: { programmeId: document.programmeId },
  });

  const run = await prisma.extractionRun.create({
    data: {
      sourceDocumentId: document.id,
      provider: 'google',
      model: getGeminiModel(),
      promptVersion: PROMPT_VERSION,
      status: 'PROCESSING',
      startedAt: new Date(),
    },
  });

  await prisma.sourceDocument.update({
    where: { id: document.id },
    data: { status: 'PROCESSING' },
  });

  return { document, runId: run.id };
}

/**
 * Heavy half of extraction: object storage → Gemini → validation → DRAFT
 * version. Safe to run detached (via `after`) after the HTTP response.
 */
export async function performExtraction(
  document: ExtractableDocument,
  runId: string,
  actorId: string
) {
  try {
    const file = await storage.getObject(document.storageKey);
    if (!file) {
      throw new AppError('The source PDF could not be retrieved from storage.', 'NOT_FOUND');
    }

    const { raw, model } = await runGeminiExtraction(
      file.data,
      buildExtractionPrompt(),
      EXTRACTION_SYSTEM_INSTRUCTION
    );

    let result: ExtractionResult;
    try {
      const parsed = parseJsonResponse(raw);
      const validation = extractionResultSchema.safeParse(parsed);
      if (!validation.success) {
        throw new AppError(
          `The extracted data did not match the expected structure: ${validation.error.issues
            .slice(0, 3)
            .map((i) => `${i.path.join('.') || '_root'}: ${i.message}`)
            .join('; ')}`,
          'INVALID_STATE'
        );
      }
      result = validation.data;
    } catch (error) {
      const message =
        error instanceof AppError
          ? error.message
          : `The response was not valid JSON: ${
              error instanceof Error ? error.message : String(error)
            }`;
      throw new AppError(message, 'INVALID_STATE');
    }

    const warnings = collectExtractionWarnings(result);

    const template = await findOrCreateTemplateForDocument(document, result.template.title);
    const version = await persistDraftVersion({
      templateId: template.id,
      sourceDocumentId: document.id,
      extractionRunId: runId,
      programmeId: document.programmeId,
      title: result.template.title,
      result,
      warnings,
      raw,
      model,
    });

    await prisma.extractionRun.update({
      where: { id: runId },
      data: {
        status: 'COMPLETED',
        rawResponse: raw,
        structuredOutput: result as unknown as Prisma.InputJsonValue,
        completedAt: new Date(),
        model,
      },
    });
    await prisma.sourceDocument.update({
      where: { id: document.id },
      data: { status: 'REVIEW_REQUIRED' },
    });

    logAuditEvent({
      action: 'EXTRACTION_COMPLETED',
      actorId,
      targetType: 'MentoringTemplateVersion',
      targetId: version.id,
      metadata: {
        sourceDocumentId: document.id,
        extractionRunId: runId,
        sections: result.sections.length,
        warnings: warnings.length,
      },
    });

    return { versionId: version.id, runId, warnings: warnings.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.extractionRun.update({
      where: { id: runId },
      data: { status: 'FAILED', errorMessage: message, completedAt: new Date() },
    });
    await prisma.sourceDocument.update({
      where: { id: document.id },
      data: { status: 'FAILED' },
    });
    logAuditEvent({
      action: 'EXTRACTION_FAILED',
      actorId,
      targetType: 'SourceDocument',
      targetId: document.id,
      metadata: { extractionRunId: runId, reason: message },
    });
    throw error;
  }
}

export async function runExtraction(documentId: string, actorId: string) {
  const { document, runId } = await beginExtraction(documentId, actorId);
  return performExtraction(document, runId, actorId);
}

async function findOrCreateTemplateForDocument(
  document: { id: string; programmeId: string },
  title: string
) {
  // One template per uploaded document; re-extraction reuses it so the new
  // extraction becomes the next numbered version of the same template.
  const existing = await prisma.mentoringTemplate.findFirst({
    where: { sourceDocumentId: document.id },
    orderBy: { createdAt: 'asc' },
  });
  if (existing) return existing;
  return prisma.mentoringTemplate.create({
    data: { programmeId: document.programmeId, title, sourceDocumentId: document.id },
  });
}

async function persistDraftVersion(args: {
  templateId: string;
  sourceDocumentId: string;
  extractionRunId: string;
  programmeId: string;
  title: string;
  result: ExtractionResult;
  warnings: ReturnType<typeof collectExtractionWarnings>;
  raw: string;
  model: string;
}) {
  const units = await prisma.curriculumUnit.findMany({
    where: { programmeId: args.programmeId, status: 'ACTIVE' },
    select: { id: true, code: true, name: true },
  });

  const last = await prisma.mentoringTemplateVersion.findFirst({
    where: { templateId: args.templateId },
    orderBy: { versionNumber: 'desc' },
    select: { versionNumber: true },
  });
  const versionNumber = (last?.versionNumber ?? 0) + 1;

  return prisma.$transaction(async (tx) => {
    const version = await tx.mentoringTemplateVersion.create({
      data: {
        templateId: args.templateId,
        versionNumber,
        status: 'DRAFT',
        sourceDocumentId: args.sourceDocumentId,
        extractionRunId: args.extractionRunId,
        title: args.title,
      },
    });

    // Pass 1: create sections with their items, rules and unit links.
    const sectionIdByNumber = new Map<string, string>();
    const sectionRecords = args.result.sections.map((section, index) => ({
      section,
      displayOrder: section.displayOrder ?? index,
    }));

    const createdIds: string[] = [];

    for (const { section, displayOrder } of sectionRecords) {
      const matchedUnitIds = matchUnits(section, units);
      const created = await tx.templateSection.create({
        data: {
          versionId: version.id,
          sectionNumber: section.sectionNumber ?? null,
          title: section.title,
          description: section.description ?? null,
          sectionType: section.sectionType ?? null,
          displayOrder,
          mappingStatus: matchedUnitIds.length > 0 ? 'MAPPED' : 'UNMAPPED',
          evaluationItems: {
            create: section.items.map((item, itemIndex) => ({
              itemNumber: item.itemNumber ?? null,
              description: item.description,
              sourceWording: item.sourceWording ?? null,
              category: item.category,
              displayOrder: item.displayOrder ?? itemIndex,
              sourceLocation: item.sourceLocation ?? null,
            })),
          },
          curriculumUnitLinks: {
            create: matchedUnitIds.map((curriculumUnitId) => ({ curriculumUnitId })),
          },
        },
      });
      createdIds.push(created.id);
      if (section.sectionNumber) {
        sectionIdByNumber.set(section.sectionNumber, created.id);
      }
    }

    // Pass 2: resolve parent references and collect rules in memory, then flush
    // with batched writes. This keeps the interactive transaction short instead
    // of paying one round-trip per section/rule over a remote connection.
    const pendingRules: Prisma.CompetencyRuleCreateManyInput[] = [];
    const parentUpdates = new Map<string, string[]>();

    for (let i = 0; i < sectionRecords.length; i += 1) {
      const { section } = sectionRecords[i];
      const sectionId = createdIds[i];

      if (section.parentSectionNumber) {
        const parentId = sectionIdByNumber.get(section.parentSectionNumber);
        if (parentId) {
          const children = parentUpdates.get(parentId) ?? [];
          children.push(sectionId);
          parentUpdates.set(parentId, children);
        }
      }

      for (const [ruleIndex, rule] of section.competencyRules.entries()) {
        pendingRules.push({
          versionId: version.id,
          sectionId,
          ruleType: rule.ruleType,
          minimumCorrect: rule.minimumCorrect ?? null,
          minimumPercentage:
            rule.minimumPercentage === null || rule.minimumPercentage === undefined
              ? null
              : Math.round(rule.minimumPercentage),
          requiredItemNumbers: (rule.requiredItemNumbers ?? []) as Prisma.InputJsonValue,
          conditions: (rule.conditions ?? undefined) as Prisma.InputJsonValue | undefined,
          sourceWording: rule.sourceWording,
          notes: rule.notes ?? null,
          displayOrder: ruleIndex,
        });
      }
    }

    for (const [parentId, childIds] of parentUpdates) {
      await tx.templateSection.updateMany({
        where: { id: { in: childIds } },
        data: { parentSectionId: parentId },
      });
    }

    if (pendingRules.length > 0) {
      await tx.competencyRule.createMany({ data: pendingRules });
    }

    if (args.warnings.length > 0) {
      await tx.templateVersionWarning.createMany({
        data: args.warnings.map((warning) => ({
          versionId: version.id,
          type: warning.type,
          message: warning.message,
          sourceReference: warning.sourceReference ?? null,
          severity: warning.severity,
        })),
      });
    }

    return version;
  }, { maxWait: 20_000, timeout: 120_000 });
}
