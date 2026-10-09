'use server';

import { revalidatePath } from 'next/cache';
import { getAdminUser } from '@/lib/auth/guards';
import { actionFailure, actionSuccess, type ActionResult } from '@/lib/actions/result';
import { toActionFailure } from '@/lib/errors';
import { fdString, parseWithSchema } from '@/lib/validation/parse';
import { institutionSchema } from '@/lib/validation/schemas';
import { updateInstitution } from '@/modules/institutions/service';

export async function updateInstitutionAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await getAdminUser();
  if (!actor) return actionFailure('You are not authorized to perform this action.', 'UNAUTHORIZED');

  const id = fdString(formData, 'id');
  if (!id) return actionFailure('Missing institution reference.', 'VALIDATION');

  const parsed = parseWithSchema(institutionSchema, {
    name: fdString(formData, 'name'),
    code: fdString(formData, 'code'),
    description: fdString(formData, 'description'),
    email: fdString(formData, 'email'),
    phone: fdString(formData, 'phone'),
    address: fdString(formData, 'address'),
  });
  if (!parsed.ok) return parsed.failure;

  try {
    await updateInstitution(id, parsed.data, actor.id);
    revalidatePath('/admin/institution');
    revalidatePath('/admin');
    return actionSuccess(undefined, 'Institution details updated.');
  } catch (error) {
    return toActionFailure(error);
  }
}