'use server';

import { revalidatePath } from 'next/cache';
import { getAdminUser } from '@/lib/auth/guards';
import { actionFailure, actionSuccess, type ActionResult } from '@/lib/actions/result';
import { toActionFailure } from '@/lib/errors';
import { fdString, parseWithSchema } from '@/lib/validation/parse';
import { departmentSchema, statusEnum } from '@/lib/validation/schemas';
import {
  createDepartment,
  setDepartmentStatus,
  updateDepartment,
} from '@/modules/institutions/service';

function readDepartment(formData: FormData) {
  return {
    name: fdString(formData, 'name'),
    code: fdString(formData, 'code'),
    description: fdString(formData, 'description'),
  };
}

export async function createDepartmentAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await getAdminUser();
  if (!actor) return actionFailure('You are not authorized to perform this action.', 'UNAUTHORIZED');

  const parsed = parseWithSchema(departmentSchema, readDepartment(formData));
  if (!parsed.ok) return parsed.failure;

  try {
    await createDepartment(parsed.data, actor.id);
    revalidatePath('/admin/departments');
    revalidatePath('/admin');
    return actionSuccess(undefined, 'Department created.');
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function updateDepartmentAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await getAdminUser();
  if (!actor) return actionFailure('You are not authorized to perform this action.', 'UNAUTHORIZED');

  const id = fdString(formData, 'id');
  if (!id) return actionFailure('Missing department reference.', 'VALIDATION');

  const parsed = parseWithSchema(departmentSchema, readDepartment(formData));
  if (!parsed.ok) return parsed.failure;

  try {
    await updateDepartment(id, parsed.data, actor.id);
    revalidatePath('/admin/departments');
    return actionSuccess(undefined, 'Department updated.');
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function setDepartmentStatusAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await getAdminUser();
  if (!actor) return actionFailure('You are not authorized to perform this action.', 'UNAUTHORIZED');

  const id = fdString(formData, 'id');
  const parsed = parseWithSchema(statusEnum, fdString(formData, 'status'));
  if (!id || !parsed.ok) return actionFailure('Invalid request.', 'VALIDATION');

  try {
    await setDepartmentStatus(id, parsed.data, actor.id);
    revalidatePath('/admin/departments');
    return actionSuccess(undefined, 'Department status updated.');
  } catch (error) {
    return toActionFailure(error);
  }
}