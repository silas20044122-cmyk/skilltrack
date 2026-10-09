import { createHash, randomUUID } from 'node:crypto';
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
      extractionRuns: { orderBy: { createdAt: 'desc' } },
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

export async function uploadSourceDocument(
  input: UploadSourceDocumentInput,
  actorId: string
) {
  await assertProgramme(input.programmeId);

  if (!isPdf(input.fileName, input.mimeType)) {
    throw new AppError('Only PDF documents can be uploaded.', 'VALIDATION', {
      file: ['Only PDF documents can be uploaded.'],
    });
  }
  if (input.data.byteLength === 0) {
    throw new AppError('The uploaded file is empty.', 'VALIDATION', {
      file: ['The uploaded file is empty.'],
    });
  }
  if (input.data.byteLength > MAX_DOCUMENT_BYTES) {
    throw new AppError('The PDF exceeds the 25 MB upload limit.', 'VALIDATION', {
      file: ['The PDF exceeds the 25 MB upload limit.'],
    });
  }

  const storageKey = storageKeyFor(input.programmeId, input.fileName);
  const fileHash = createHash('sha256').update(input.data).digest('hex');

  await storage.putObject(storageKey, input.data, PDF_MIME);

  try {
    const document = await prisma.sourceDocument.create({
      data: {
        programmeId: input.programmeId,
        fileName: input.fileName,
        storageKey,
        fileHash,
        mimeType: PDF_MIME,
        fileSize: input.data.byteLength,
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
  } catch (error) {
    // Do not leave an orphaned object if the metadata write fails.
    await storage.deleteObject(storageKey).catch(() => undefined);
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
        where: { status: { in: ['VALIDATED', 'PUBLISHED'] } },
        select: { id: true },
      },
    },
  });
  if (!document) throw new AppError('The document could not be found.', 'NOT_FOUND');
  if (document.templateVersions.length > 0) {
    throw new AppError(
      'This document has a validated template and cannot be deleted.',
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
