'use server';

import { revalidatePath } from 'next/cache';
import { getAdminUser } from '@/lib/auth/guards';
import { actionFailure, actionSuccess, type ActionResult } from '@/lib/actions/result';
import { toActionFailure } from '@/lib/errors';
import { fdString, parseWithSchema } from '@/lib/validation/parse';
import { sourceDocumentUploadSchema } from '@/lib/validation/schemas';
import {
  deleteSourceDocument,
  uploadSourceDocument,
} from '@/modules/documents/service';
import { runExtraction } from '@/modules/documents/extraction/service';

export async function uploadSourceDocumentAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await getAdminUser();
  if (!actor) return actionFailure('You are not authorized to perform this action.', 'UNAUTHORIZED');

  const parsed = parseWithSchema(sourceDocumentUploadSchema, {
    programmeId: fdString(formData, 'programmeId'),
  });
  if (!parsed.ok) return parsed.failure;

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return actionFailure('Select a PDF file to upload.', 'VALIDATION', {
      file: ['Select a PDF file to upload.'],
    });
  }

  try {
    const data = Buffer.from(await file.arrayBuffer());
    await uploadSourceDocument(
      {
        programmeId: parsed.data.programmeId,
        fileName: file.name,
        mimeType: file.type,
        data,
      },
      actor.id
    );
    revalidatePath(`/admin/programmes/${parsed.data.programmeId}/documents`);
    revalidatePath('/admin/documents');
    return actionSuccess(undefined, 'Document uploaded.');
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function runExtractionAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await getAdminUser();
  if (!actor) return actionFailure('You are not authorized to perform this action.', 'UNAUTHORIZED');

  const documentId = fdString(formData, 'documentId');
  if (!documentId) return actionFailure('Missing document reference.', 'VALIDATION');

  try {
    const result = await runExtraction(documentId, actor.id);
    revalidatePath(`/admin/documents/${documentId}`);
    revalidatePath(`/admin/documents/${documentId}/review`);
    revalidatePath('/admin/documents');
    return actionSuccess(
      undefined,
      `Extraction complete — ${result.warnings} warning${result.warnings === 1 ? '' : 's'} recorded.`
    );
  } catch (error) {
    revalidatePath(`/admin/documents/${documentId}`);
    return toActionFailure(error);
  }
}

export async function deleteSourceDocumentAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await getAdminUser();
  if (!actor) return actionFailure('You are not authorized to perform this action.', 'UNAUTHORIZED');

  const documentId = fdString(formData, 'documentId');
  const programmeId = fdString(formData, 'programmeId');
  if (!documentId) return actionFailure('Missing document reference.', 'VALIDATION');

  try {
    await deleteSourceDocument(documentId, actor.id);
    if (programmeId) revalidatePath(`/admin/programmes/${programmeId}/documents`);
    revalidatePath('/admin/documents');
    return actionSuccess(undefined, 'Document deleted.');
  } catch (error) {
    return toActionFailure(error);
  }
}
