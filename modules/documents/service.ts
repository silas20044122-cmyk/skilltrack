import { createHash, randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { AppError } from '@/lib/errors';
import { logAuditEvent } from '@/lib/audit/log-audit-event';
import { storage, type StoredObject } from '@/lib/storage';

/**
 * Source document domain services.
 *
 * PDFs are never stored in PostgreSQL: the binary goes to object storage and
 * only a `storageKey` is persisted. All retrieval is authorization-checked at
 * the route layer; there are no public URLs.
 */

export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024; // 25 MB
const PDF_MIME = 'application/pdf';

function isPdf(fileName: string, mimeType: string) {
  return mimeType === PDF_MIME || fileName.toLowerCase().endsWith('.pdf');
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(-120) || 'document.pdf';
}

function storageKeyFor(programmeId: string, fileName: string) {
  return `programmes/${programmeId}/documents/${randomUUID()}-${sanitizeFileName(fileName)}`;
}

export interface UploadSourceDocumentInput {
  programmeId: string;
  fileName: string;
  mimeType: string;
  data: Buffer;
}

export async function listSourceDocuments(programmeId: string) {
  return prisma.sourceDocument.findMany({
    where: { programmeId },
    orderBy: { createdAt: 'desc' },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true } },
      _count: { select: { extractionRuns: true, templateVersions: true } },
    },
  });
}

export async function listRecentSourceDocuments(limit = 10) {
  return prisma.sourceDocument.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      programme: { select: { id: true, name: true, code: true } },
      _count: { select: { extractionRuns: true } },
    },
  });
}

export async function getSourceDocument(id: string) {
  return prisma.sourceDocument.findUnique({
    where: { id },
    include: {
      programme: { select: { id: true, name: true, code: true } },
      uploadedBy: { select: { id: true, name: true, email: true } },
      // Only list-safe columns: ExtractionRun.rawResponse/structuredOutput are
      // large JSON payloads that must never be pulled into a page render.
      extractionRuns: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          model: true,
          promptVersion: true,
          status: true,
          errorMessage: true,
          createdAt: true,
        },
      },
      templateVersions: {
        orderBy: { versionNumber: 'desc' },
        select: {
          id: true,
          versionNumber: true,
          status: true,
          template: { select: { id: true, title: true } },
        },
      },
    },
  });
}

async function assertProgramme(programmeId: string) {
  const programme = await prisma.programme.findUnique({
    where: { id: programmeId },
    select: { id: true },
  });
  if (!programme) {
    throw new AppError('The selected programme does not exist.', 'NOT_FOUND', {
      programmeId: ['Select a valid programme.'],
    });
  }
}

function assertPdf(fileName: string, mimeType: string) {
  if (!isPdf(fileName, mimeType)) {
    throw new AppError('Only PDF documents can be uploaded.', 'VALIDATION', {
      file: ['Only PDF documents can be uploaded.'],
    });
  }
}

function assertWithinSizeLimit(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    throw new AppError('The uploaded file is empty.', 'VALIDATION', {
      file: ['The uploaded file is empty.'],
    });
  }
  if (bytes > MAX_DOCUMENT_BYTES) {
    throw new AppError('The PDF exceeds the 25 MB upload limit.', 'VALIDATION', {
      file: ['The PDF exceeds the 25 MB upload limit.'],
    });
  }
}

async function persistSourceDocument(
  input: {
    programmeId: string;
    fileName: string;
    storageKey: string;
    fileHash: string;
    fileSize: number;
    mimeType: string;
  },
  actorId: string
) {
  const document = await prisma.sourceDocument.create({
    data: {
      programmeId: input.programmeId,
      fileName: input.fileName,
      storageKey: input.storageKey,
      fileHash: input.fileHash,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      uploadedById: actorId,
      status: 'UPLOADED',
    },
  });
  logAuditEvent({
    action: 'SOURCE_DOCUMENT_UPLOADED',
    actorId,
    targetType: 'SourceDocument',
    targetId: document.id,
    metadata: {
      programmeId: document.programmeId,
      fileName: document.fileName,
      fileSize: document.fileSize,
    },
  });
  return document;
}

/**
 * Server-side upload (used by tests and any trusted server caller). Small files
 * only: browser uploads must go through `createSourceDocumentUploadTarget` +
 * `finalizeSourceDocumentUpload` so they never pass through a function body.
 */
export async function uploadSourceDocument(
  input: UploadSourceDocumentInput,
  actorId: string
) {
  await assertProgramme(input.programmeId);
  assertPdf(input.fileName, input.mimeType);
  assertWithinSizeLimit(input.data.byteLength);

  const storageKey = storageKeyFor(input.programmeId, input.fileName);
  const fileHash = createHash('sha256').update(input.data).digest('hex');

  await storage.putObject(storageKey, input.data, PDF_MIME);

  try {
    return await persistSourceDocument(
      {
        programmeId: input.programmeId,
        fileName: input.fileName,
        storageKey,
        fileHash,
        fileSize: input.data.byteLength,
        mimeType: PDF_MIME,
      },
      actorId
    );
  } catch (error) {
    // Do not leave an orphaned object if the metadata write fails.
    await storage.deleteObject(storageKey).catch(() => undefined);
    throw error;
  }
}

export interface CreateSourceDocumentUploadTargetInput {
  programmeId: string;
  fileName: string;
  mimeType: string;
  size: number;
}

/**
 * Validate an upload and return a short-lived signed target so the browser can
 * PUT the PDF straight to object storage. This bypasses the serverless
 * request-body limit (Vercel caps function bodies at ~4.5 MB) while keeping the
 * 25 MB application limit and all authorization server-side.
 */
export async function createSourceDocumentUploadTarget(
  input: CreateSourceDocumentUploadTargetInput
) {
  await assertProgramme(input.programmeId);
  assertPdf(input.fileName, input.mimeType);
  assertWithinSizeLimit(input.size);

  const storageKey = storageKeyFor(input.programmeId, input.fileName);
  const target = await storage.createUploadTarget(storageKey);
  return { storageKey, token: target.token };
}

export interface FinalizeSourceDocumentUploadInput {
  programmeId: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
  size: number;
  fileHash: string;
}

/**
 * Record a document that the client has already uploaded directly to storage.
 * The object is verified to exist (and its authoritative size re-checked)
 * before any metadata is written.
 */
export async function finalizeSourceDocumentUpload(
  input: FinalizeSourceDocumentUploadInput,
  actorId: string
) {
  await assertProgramme(input.programmeId);
  assertPdf(input.fileName, input.mimeType);

  const prefix = `programmes/${input.programmeId}/documents/`;
  if (!input.storageKey.startsWith(prefix)) {
    throw new AppError('The uploaded file reference is not valid.', 'VALIDATION');
  }

  const info = await storage.getObjectInfo(input.storageKey);
  if (!info) {
    throw new AppError('The uploaded file could not be found in storage.', 'NOT_FOUND');
  }
  assertWithinSizeLimit(info.size || input.size);

  try {
    return await persistSourceDocument(
      {
        programmeId: input.programmeId,
        fileName: input.fileName,
        storageKey: input.storageKey,
        fileHash: input.fileHash,
        fileSize: info.size || input.size,
        mimeType: PDF_MIME,
      },
      actorId
    );
  } catch (error) {
    // A repeat finalize is not an error: return the row already recorded.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const existing = await prisma.sourceDocument.findUnique({
        where: { storageKey: input.storageKey },
      });
      if (existing) return existing;
    }
    await storage.deleteObject(input.storageKey).catch(() => undefined);
    throw error;
  }
}

export async function getSourceDocumentFile(id: string): Promise<StoredObject | null> {
  const document = await prisma.sourceDocument.findUnique({
    where: { id },
    select: { storageKey: true },
  });
  if (!document) return null;
  return storage.getObject(document.storageKey);
}

export async function deleteSourceDocument(id: string, actorId: string) {
  const document = await prisma.sourceDocument.findUnique({
    where: { id },
    select: {
      id: true,
      storageKey: true,
      templateVersions: {
        where: { status: { in: ['READY_FOR_PUBLISH', 'PUBLISHED'] } },
        select: { id: true },
      },
    },
  });
  if (!document) throw new AppError('The document could not be found.', 'NOT_FOUND');
  if (document.templateVersions.length > 0) {
    throw new AppError(
      'This document has a template marked ready for publication and cannot be deleted.',
      'INVALID_STATE'
    );
  }

  await prisma.sourceDocument.delete({ where: { id } });
  await storage.deleteObject(document.storageKey).catch(() => undefined);

  logAuditEvent({
    action: 'SOURCE_DOCUMENT_DELETED',
    actorId,
    targetType: 'SourceDocument',
    targetId: id,
  });
}
