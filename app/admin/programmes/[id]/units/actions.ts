'use server';

import { revalidatePath } from 'next/cache';
import { getAdminUser } from '@/lib/auth/guards';
import { actionFailure, actionSuccess, type ActionResult } from '@/lib/actions/result';
import { toActionFailure } from '@/lib/errors';
import { fdString, parseWithSchema } from '@/lib/validation/parse';
import { curriculumUnitSchema, curriculumUnitUpdateSchema, statusEnum } from '@/lib/validation/schemas';
import {
  createCurriculumUnit,
  setCurriculumUnitStatus,
  updateCurriculumUnit,
} from '@/modules/curriculum/service';

function readUnit(formData: FormData) {
  return {
    programmeId: fdString(formData, 'programmeId'),
    name: fdString(formData, 'name'),
    code: fdString(formData, 'code'),
    description: fdString(formData, 'description'),
    position: fdString(formData, 'position'),
  };
}

export async function createCurriculumUnitAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await getAdminUser();
  if (!actor) return actionFailure('You are not authorized to perform this action.', 'UNAUTHORIZED');

  const parsed = parseWithSchema(curriculumUnitSchema, readUnit(formData));
  if (!parsed.ok) return parsed.failure;

  try {
    await createCurriculumUnit(parsed.data, actor.id);
    revalidatePath(`/admin/programmes/${parsed.data.programmeId}/units`);
    return actionSuccess(undefined, 'Curriculum unit added.');
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function updateCurriculumUnitAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await getAdminUser();
  if (!actor) return actionFailure('You are not authorized to perform this action.', 'UNAUTHORIZED');

  const id = fdString(formData, 'id');
  const programmeId = fdString(formData, 'programmeId');
  if (!id) return actionFailure('Missing curriculum unit reference.', 'VALIDATION');

  const parsed = parseWithSchema(curriculumUnitUpdateSchema, readUnit(formData));
  if (!parsed.ok) return parsed.failure;

  try {
    await updateCurriculumUnit(id, parsed.data, actor.id);
    if (programmeId) revalidatePath(`/admin/programmes/${programmeId}/units`);
    return actionSuccess(undefined, 'Curriculum unit updated.');
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function setCurriculumUnitStatusAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await getAdminUser();
  if (!actor) return actionFailure('You are not authorized to perform this action.', 'UNAUTHORIZED');

  const id = fdString(formData, 'id');
  const programmeId = fdString(formData, 'programmeId');
  const parsed = parseWithSchema(statusEnum, fdString(formData, 'status'));
  if (!id || !parsed.ok) return actionFailure('Invalid request.', 'VALIDATION');

  try {
    await setCurriculumUnitStatus(id, parsed.data, actor.id);
    if (programmeId) revalidatePath(`/admin/programmes/${programmeId}/units`);
    return actionSuccess(undefined, 'Curriculum unit status updated.');
  } catch (error) {
    return toActionFailure(error);
  }
}
