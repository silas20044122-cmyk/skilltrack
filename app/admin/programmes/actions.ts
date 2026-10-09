'use server';

import { revalidatePath } from 'next/cache';
import { getAdminUser } from '@/lib/auth/guards';
import { actionFailure, actionSuccess, type ActionResult } from '@/lib/actions/result';
import { toActionFailure } from '@/lib/errors';
import { fdString, parseWithSchema } from '@/lib/validation/parse';
import { programmeSchema, statusEnum } from '@/lib/validation/schemas';
import {
  createProgramme,
  setProgrammeStatus,
  updateProgramme,
} from '@/modules/programmes/service';

function readProgramme(formData: FormData) {
  return {
    departmentId: fdString(formData, 'departmentId'),
    name: fdString(formData, 'name'),
    code: fdString(formData, 'code'),
    level: fdString(formData, 'level'),
    description: fdString(formData, 'description'),
  };
}

export async function createProgrammeAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await getAdminUser();
  if (!actor) return actionFailure('You are not authorized to perform this action.', 'UNAUTHORIZED');

  const parsed = parseWithSchema(programmeSchema, readProgramme(formData));
  if (!parsed.ok) return parsed.failure;

  try {
    await createProgramme(parsed.data, actor.id);
    revalidatePath('/admin/programmes');
    revalidatePath('/admin');
    return actionSuccess(undefined, 'Programme created.');
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function updateProgrammeAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await getAdminUser();
  if (!actor) return actionFailure('You are not authorized to perform this action.', 'UNAUTHORIZED');

  const id = fdString(formData, 'id');
  if (!id) return actionFailure('Missing programme reference.', 'VALIDATION');

  const parsed = parseWithSchema(programmeSchema, readProgramme(formData));
  if (!parsed.ok) return parsed.failure;

  try {
    await updateProgramme(id, parsed.data, actor.id);
    revalidatePath('/admin/programmes');
    return actionSuccess(undefined, 'Programme updated.');
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function setProgrammeStatusAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await getAdminUser();
  if (!actor) return actionFailure('You are not authorized to perform this action.', 'UNAUTHORIZED');

  const id = fdString(formData, 'id');
  const parsed = parseWithSchema(statusEnum, fdString(formData, 'status'));
  if (!id || !parsed.ok) return actionFailure('Invalid request.', 'VALIDATION');

  try {
    await setProgrammeStatus(id, parsed.data, actor.id);
    revalidatePath('/admin/programmes');
    return actionSuccess(undefined, 'Programme status updated.');
  } catch (error) {
    return toActionFailure(error);
  }
}