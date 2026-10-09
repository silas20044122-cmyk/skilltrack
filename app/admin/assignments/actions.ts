'use server';

import { revalidatePath } from 'next/cache';
import { getAdminUser } from '@/lib/auth/guards';
import { actionFailure, actionSuccess, type ActionResult } from '@/lib/actions/result';
import { toActionFailure } from '@/lib/errors';
import { fdString, parseWithSchema } from '@/lib/validation/parse';
import { assignmentCreateSchema, assignmentUpdateSchema } from '@/lib/validation/schemas';
import { createAssignment, updateAssignment } from '@/modules/assignments/service';

export async function createAssignmentAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await getAdminUser();
  if (!actor) return actionFailure('You are not authorized to perform this action.', 'UNAUTHORIZED');

  const parsed = parseWithSchema(assignmentCreateSchema, {
    mentorId: fdString(formData, 'mentorId'),
    traineeId: fdString(formData, 'traineeId'),
    notes: fdString(formData, 'notes'),
    startDate: fdString(formData, 'startDate'),
  });
  if (!parsed.ok) return parsed.failure;

  try {
    await createAssignment(parsed.data, actor.id);
    revalidatePath('/admin/assignments');
    revalidatePath('/admin');
    return actionSuccess(undefined, 'Mentor assignment created.');
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function updateAssignmentAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await getAdminUser();
  if (!actor) return actionFailure('You are not authorized to perform this action.', 'UNAUTHORIZED');

  const id = fdString(formData, 'id');
  if (!id) return actionFailure('Missing assignment reference.', 'VALIDATION');

  const parsed = parseWithSchema(assignmentUpdateSchema, {
    status: fdString(formData, 'status'),
    notes: fdString(formData, 'notes'),
    endDate: fdString(formData, 'endDate'),
  });
  if (!parsed.ok) return parsed.failure;

  try {
    await updateAssignment(id, parsed.data, actor.id);
    revalidatePath('/admin/assignments');
    return actionSuccess(undefined, 'Assignment updated.');
  } catch (error) {
    return toActionFailure(error);
  }
}