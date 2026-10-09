'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { getAdminUser } from '@/lib/auth/guards';
import { actionFailure, actionSuccess, type ActionResult } from '@/lib/actions/result';
import { toActionFailure } from '@/lib/errors';
import { fdString, parseWithSchema } from '@/lib/validation/parse';
import {
  sourceDocumentFinalizeSchema,
  sourceDocumentUploadTargetSchema,
} from '@/lib/validation/schemas';
import {
  createSourceDocumentUploadTarget,
  deleteSourceDocument,
  finalizeSourceDocumentUpload,
} from '@/modules/documents/service';
import { getStorageBucketName } from '@/lib/storage';
import { beginExtraction, performExtraction } from '@/modules/documents/extraction/service';

export async function createSourceDocumentUploadTargetAction(
  formData: FormData
): Promise<ActionResult<{ storageKey: string; token: string; bucket: string }>> {
  const actor = await getAdminUser();
  if (!actor) return actionFailure('You are not authorized to perform this action.', 'UNAUTHORIZED');

  const parsed = parseWithSchema(sourceDocumentUploadTargetSchema, {
    programmeId: fdString(formData, 'programmeId'),
    fileName: fdString(formData, 'fileName'),
    mimeType: fdString(formData, 'mimeType'),
    size: fdString(formData, 'size'),
  });
  if (!parsed.ok) return parsed.failure;

  try {
    const target = await createSourceDocumentUploadTarget(parsed.data);
    return actionSuccess({
      storageKey: target.storageKey,
      token: target.token,
      bucket: getStorageBucketName(),
    });
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function finalizeSourceDocumentUploadAction(
  formData: FormData
): Promise<ActionResult> {
  const actor = await getAdminUser();
  if (!actor) return actionFailure('You are not authorized to perform this action.', 'UNAUTHORIZED');

  const parsed = parseWithSchema(sourceDocumentFinalizeSchema, {
    programmeId: fdString(formData, 'programmeId'),
    fileName: fdString(formData, 'fileName'),
    mimeType: fdString(formData, 'mimeType'),
    size: fdString(formData, 'size'),
    storageKey: fdString(formData, 'storageKey'),
    fileHash: fdString(formData, 'fileHash'),
  });
  if (!parsed.ok) return parsed.failure;

  try {
    await finalizeSourceDocumentUpload(parsed.data, actor.id);
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
    const { document, runId } = await beginExtraction(documentId, actor.id);

    // Keep the interactive action fast: Gemini extraction runs detached, after
    // the response is sent, bounded by the route's maxDuration.
    after(async () => {
      try {
        await performExtraction(document, runId, actor.id);
      } catch (error) {
        console.error('Extraction failed', { documentId, runId, error });
      }
    });

    revalidatePath(`/admin/documents/${documentId}`);
    revalidatePath('/admin/documents');
    return actionSuccess(
      undefined,
      'Extraction started — this page will update automatically when it completes.'
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
