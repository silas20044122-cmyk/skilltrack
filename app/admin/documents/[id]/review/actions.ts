'use server';

import { revalidatePath } from 'next/cache';
import { getAdminUser } from '@/lib/auth/guards';
import { actionFailure, actionSuccess, type ActionResult } from '@/lib/actions/result';
import { toActionFailure } from '@/lib/errors';
import { fdString, fdStringAll, parseWithSchema } from '@/lib/validation/parse';
import {
  competencyRuleUpdateSchema,
  evaluationItemUpdateSchema,
  sectionMappingSchema,
  sectionUpdateSchema,
  versionValidateSchema,
} from '@/lib/validation/schemas';
import {
  markReadyForPublish,
  setSectionMapping,
  updateCompetencyRule,
  updateEvaluationItem,
  updateSection,
} from '@/modules/templates/service';

function revalidateReview(documentId: string) {
  revalidatePath(`/admin/documents/${documentId}`);
  revalidatePath(`/admin/documents/${documentId}/review`);
}

export async function updateSectionAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await getAdminUser();
  if (!actor) return actionFailure('You are not authorized to perform this action.', 'UNAUTHORIZED');

  const sectionId = fdString(formData, 'sectionId');
  const documentId = fdString(formData, 'documentId');
  if (!sectionId) return actionFailure('Missing section reference.', 'VALIDATION');

  const parsed = parseWithSchema(sectionUpdateSchema, {
    title: fdString(formData, 'title'),
    sectionNumber: fdString(formData, 'sectionNumber'),
    description: fdString(formData, 'description'),
    sectionType: fdString(formData, 'sectionType'),
    mappingStatus: fdString(formData, 'mappingStatus'),
  });
  if (!parsed.ok) return parsed.failure;

  try {
    await updateSection(sectionId, parsed.data, actor.id);
    if (documentId) revalidateReview(documentId);
    return actionSuccess(undefined, 'Section saved.');
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function updateEvaluationItemAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await getAdminUser();
  if (!actor) return actionFailure('You are not authorized to perform this action.', 'UNAUTHORIZED');

  const itemId = fdString(formData, 'itemId');
  const documentId = fdString(formData, 'documentId');
  if (!itemId) return actionFailure('Missing item reference.', 'VALIDATION');

  const parsed = parseWithSchema(evaluationItemUpdateSchema, {
    description: fdString(formData, 'description'),
    itemNumber: fdString(formData, 'itemNumber'),
    category: fdString(formData, 'category'),
    sourceWording: fdString(formData, 'sourceWording'),
    notes: fdString(formData, 'notes'),
  });
  if (!parsed.ok) return parsed.failure;

  try {
    await updateEvaluationItem(itemId, parsed.data, actor.id);
    if (documentId) revalidateReview(documentId);
    return actionSuccess(undefined, 'Item saved.');
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function updateCompetencyRuleAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await getAdminUser();
  if (!actor) return actionFailure('You are not authorized to perform this action.', 'UNAUTHORIZED');

  const ruleId = fdString(formData, 'ruleId');
  const documentId = fdString(formData, 'documentId');
  if (!ruleId) return actionFailure('Missing rule reference.', 'VALIDATION');

  const parsed = parseWithSchema(competencyRuleUpdateSchema, {
    ruleType: fdString(formData, 'ruleType'),
    minimumCorrect: fdString(formData, 'minimumCorrect'),
    minimumPercentage: fdString(formData, 'minimumPercentage'),
    requiredItemNumbers: fdString(formData, 'requiredItemNumbers'),
    sourceWording: fdString(formData, 'sourceWording'),
    notes: fdString(formData, 'notes'),
  });
  if (!parsed.ok) return parsed.failure;

  try {
    await updateCompetencyRule(ruleId, parsed.data, actor.id);
    if (documentId) revalidateReview(documentId);
    return actionSuccess(undefined, 'Rule saved.');
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function setSectionMappingAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await getAdminUser();
  if (!actor) return actionFailure('You are not authorized to perform this action.', 'UNAUTHORIZED');

  const sectionId = fdString(formData, 'sectionId');
  const documentId = fdString(formData, 'documentId');
  if (!sectionId) return actionFailure('Missing section reference.', 'VALIDATION');

  const parsed = parseWithSchema(sectionMappingSchema, {
    sectionId,
    mappingStatus: fdString(formData, 'mappingStatus'),
    unitIds: fdStringAll(formData, 'unitIds'),
  });
  if (!parsed.ok) return parsed.failure;

  try {
    await setSectionMapping(parsed.data, actor.id);
    if (documentId) revalidateReview(documentId);
    return actionSuccess(undefined, 'Curriculum mapping saved.');
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function validateVersionAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await getAdminUser();
  if (!actor) return actionFailure('You are not authorized to perform this action.', 'UNAUTHORIZED');

  const documentId = fdString(formData, 'documentId');
  const parsed = parseWithSchema(versionValidateSchema, {
    versionId: fdString(formData, 'versionId'),
    notes: fdString(formData, 'notes'),
  });
  if (!parsed.ok) return parsed.failure;

  try {
    await markReadyForPublish(parsed.data, actor.id);
    if (documentId) revalidateReview(documentId);
    revalidatePath('/admin/documents');
    return actionSuccess(undefined, 'Template version marked ready for publication.');
  } catch (error) {
    return toActionFailure(error);
  }
}
