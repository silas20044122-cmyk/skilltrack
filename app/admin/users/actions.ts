'use server';

import { revalidatePath } from 'next/cache';
import { getAdminUser } from '@/lib/auth/guards';
import { actionFailure, actionSuccess, type ActionResult } from '@/lib/actions/result';
import { toActionFailure } from '@/lib/errors';
import { fdString, fdStringAll, parseWithSchema } from '@/lib/validation/parse';
import {
  passwordResetSchema,
  roleAssignmentSchema,
  statusEnum,
  userCreateSchema,
  userUpdateSchema,
} from '@/lib/validation/schemas';
import {
  assignRole,
  createUser,
  removeRole,
  resetPassword,
  setUserStatus,
  updateUser,
} from '@/modules/users/service';
import type { RoleCode } from '@/types/auth';

function readProfileFields(formData: FormData) {
  return {
    registrationNumber: fdString(formData, 'registrationNumber'),
    programmeId: fdString(formData, 'programmeId'),
    companyName: fdString(formData, 'companyName'),
    jobTitle: fdString(formData, 'jobTitle'),
    contactEmail: fdString(formData, 'contactEmail'),
    phone: fdString(formData, 'phone'),
    designation: fdString(formData, 'designation'),
    officeEmail: fdString(formData, 'officeEmail'),
    institutionId: fdString(formData, 'institutionId'),
  };
}

export async function createUserAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await getAdminUser();
  if (!actor) return actionFailure('You are not authorized to perform this action.', 'UNAUTHORIZED');

  const parsed = parseWithSchema(userCreateSchema, {
    name: fdString(formData, 'name'),
    email: fdString(formData, 'email'),
    password: fdString(formData, 'password'),
    status: fdString(formData, 'status') ?? 'ACTIVE',
    roles: fdStringAll(formData, 'roles'),
    ...readProfileFields(formData),
  });
  if (!parsed.ok) return parsed.failure;

  try {
    await createUser(parsed.data, actor.id);
    revalidatePath('/admin/users');
    revalidatePath('/admin');
    return actionSuccess(undefined, 'User created successfully.');
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function updateUserAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await getAdminUser();
  if (!actor) return actionFailure('You are not authorized to perform this action.', 'UNAUTHORIZED');

  const id = fdString(formData, 'id');
  if (!id) return actionFailure('Missing user reference.', 'VALIDATION');

  const parsed = parseWithSchema(userUpdateSchema, {
    name: fdString(formData, 'name'),
    email: fdString(formData, 'email'),
    status: fdString(formData, 'status') ?? 'ACTIVE',
    ...readProfileFields(formData),
  });
  if (!parsed.ok) return parsed.failure;

  try {
    await updateUser(id, parsed.data, actor.id);
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${id}`);
    return actionSuccess(undefined, 'User details updated.');
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function setUserStatusAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await getAdminUser();
  if (!actor) return actionFailure('You are not authorized to perform this action.', 'UNAUTHORIZED');

  const id = fdString(formData, 'id');
  const parsed = parseWithSchema(statusEnum, fdString(formData, 'status'));
  if (!id || !parsed.ok) return actionFailure('Invalid request.', 'VALIDATION');

  try {
    await setUserStatus(id, parsed.data, actor.id);
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${id}`);
    return actionSuccess(undefined, 'Account status updated.');
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function assignRoleAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await getAdminUser();
  if (!actor) return actionFailure('You are not authorized to perform this action.', 'UNAUTHORIZED');

  const userId = fdString(formData, 'userId');
  const parsed = parseWithSchema(roleAssignmentSchema, { role: fdString(formData, 'role') });
  if (!userId || !parsed.ok) return actionFailure('Invalid request.', 'VALIDATION');

  try {
    await assignRole(userId, parsed.data.role, actor.id);
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath('/admin/users');
    return actionSuccess(undefined, 'Role assigned.');
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function removeRoleAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await getAdminUser();
  if (!actor) return actionFailure('You are not authorized to perform this action.', 'UNAUTHORIZED');

  const userId = fdString(formData, 'userId');
  const parsed = parseWithSchema(roleAssignmentSchema, { role: fdString(formData, 'role') });
  if (!userId || !parsed.ok) return actionFailure('Invalid request.', 'VALIDATION');

  try {
    await removeRole(userId, parsed.data.role as RoleCode, actor.id);
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath('/admin/users');
    return actionSuccess(undefined, 'Role removed.');
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function resetPasswordAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await getAdminUser();
  if (!actor) return actionFailure('You are not authorized to perform this action.', 'UNAUTHORIZED');

  const id = fdString(formData, 'id');
  const parsed = parseWithSchema(passwordResetSchema, {
    password: fdString(formData, 'password'),
  });
  if (!id || !parsed.ok) return actionFailure('Invalid request.', 'VALIDATION');

  try {
    await resetPassword(id, parsed.data.password, actor.id);
    revalidatePath(`/admin/users/${id}`);
    return actionSuccess(undefined, 'Password reset successfully.');
  } catch (error) {
    return toActionFailure(error);
  }
}