'use server';

import { revalidatePath } from 'next/cache';
import { getAdminUser } from '@/lib/auth/guards';
import { actionFailure, actionSuccess, type ActionResult } from '@/lib/actions/result';
import { toActionFailure } from '@/lib/errors';
import { fdString, fdStringAll, parseWithSchema } from '@/lib/validation/parse';
import {
  competencyRuleCreateSchema,
  competencyRuleUpdateSchema,
  evaluationItemCreateSchema,
  evaluationItemUpdateSchema,
  sectionCreateSchema,
  sectionMappingSchema,
  sectionMoveSchema,
  sectionUpdateSchema,
  templateCreateSchema,
  templateUpdateSchema,
  versionCloneSchema,
  versionPublishSchema,
  versionTransitionSchema,
  versionValidateSchema,
} from '@/lib/validation/schemas';
import {
  createCompetencyRule,
  createEvaluationItem,
  createSection,
  createTemplate,
  deleteCompetencyRule,
  deleteEvaluationItem,
  deleteSection,
  markReadyForPublish,
  moveSection,
  runTemplateValidation,
  setSectionMapping,
  transitionTemplateVersion,
  updateCompetencyRule,
  updateEvaluationItem,
  updateSection,
  updateTemplate,
} from '@/modules/templates/service';
import { createDraftFromVersion, publishTemplateVersion } from '@/modules/templates/publishing';

function revalidateTemplates(templateId?: string) {
  revalidatePath('/admin/templates');
  if (templateId) revalidatePath(`/admin/templates/${templateId}`);
}

async function requireActor() {
  return getAdminUser();
}

const UNAUTHORIZED = actionFailure(
  'You are not authorized to perform this action.',
  'UNAUTHORIZED'
);

// ---------------------------------------------------------------------------
// Template authoring
// ---------------------------------------------------------------------------

export async function createTemplateAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await requireActor();
  if (!actor) return UNAUTHORIZED;

  const parsed = parseWithSchema(templateCreateSchema, {
    programmeId: fdString(formData, 'programmeId'),
    title: fdString(formData, 'title'),
    description: fdString(formData, 'description'),
  });
  if (!parsed.ok) return parsed.failure;

  try {
    await createTemplate(parsed.data, actor.id);
    revalidateTemplates();
    return actionSuccess(undefined, 'Template created with a draft version.');
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function updateTemplateAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await requireActor();
  if (!actor) return UNAUTHORIZED;

  const templateId = fdString(formData, 'templateId');
  if (!templateId) return actionFailure('Missing template reference.', 'VALIDATION');

  const parsed = parseWithSchema(templateUpdateSchema, {
    title: fdString(formData, 'title'),
    description: fdString(formData, 'description'),
  });
  if (!parsed.ok) return parsed.failure;

  try {
    await updateTemplate(templateId, parsed.data, actor.id);
    revalidateTemplates(templateId);
    return actionSuccess(undefined, 'Template saved.');
  } catch (error) {
    return toActionFailure(error);
  }
}

// ---------------------------------------------------------------------------
// Lifecycle, validation and publishing
// ---------------------------------------------------------------------------

export async function validateVersionAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await requireActor();
  if (!actor) return UNAUTHORIZED;

  const templateId = fdString(formData, 'templateId');
  const parsed = parseWithSchema(versionValidateSchema, {
    versionId: fdString(formData, 'versionId'),
    notes: fdString(formData, 'notes'),
  });
  if (!parsed.ok) return parsed.failure;

  try {
    const report = await runTemplateValidation(parsed.data.versionId, actor.id);
    revalidateTemplates(templateId);
    return actionSuccess(
      undefined,
      report.ok
        ? `Validation passed with ${report.warningCount} warning(s).`
        : `Validation found ${report.errorCount} blocking issue(s).`
    );
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function markReadyAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await requireActor();
  if (!actor) return UNAUTHORIZED;

  const templateId = fdString(formData, 'templateId');
  const parsed = parseWithSchema(versionValidateSchema, {
    versionId: fdString(formData, 'versionId'),
    notes: fdString(formData, 'notes'),
  });
  if (!parsed.ok) return parsed.failure;

  try {
    await markReadyForPublish(parsed.data, actor.id);
    revalidateTemplates(templateId);
    return actionSuccess(undefined, 'Version marked ready for publication.');
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function transitionVersionAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await requireActor();
  if (!actor) return UNAUTHORIZED;

  const templateId = fdString(formData, 'templateId');
  const parsed = parseWithSchema(versionTransitionSchema, {
    versionId: fdString(formData, 'versionId'),
    to: fdString(formData, 'to'),
  });
  if (!parsed.ok) return parsed.failure;

  try {
    await transitionTemplateVersion(parsed.data.versionId, parsed.data.to, actor.id);
    revalidateTemplates(templateId);
    return actionSuccess(undefined, 'Version status updated.');
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function publishVersionAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await requireActor();
  if (!actor) return UNAUTHORIZED;

  const templateId = fdString(formData, 'templateId');
  const parsed = parseWithSchema(versionPublishSchema, {
    versionId: fdString(formData, 'versionId'),
  });
  if (!parsed.ok) return parsed.failure;

  try {
    await publishTemplateVersion(parsed.data.versionId, actor.id);
    revalidateTemplates(templateId);
    return actionSuccess(undefined, 'Template version published.');
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function cloneVersionAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await requireActor();
  if (!actor) return UNAUTHORIZED;

  const templateId = fdString(formData, 'templateId');
  const parsed = parseWithSchema(versionCloneSchema, {
    sourceVersionId: fdString(formData, 'sourceVersionId'),
  });
  if (!parsed.ok) return parsed.failure;

  try {
    await createDraftFromVersion(parsed.data.sourceVersionId, actor.id);
    revalidateTemplates(templateId);
    return actionSuccess(undefined, 'New draft created from the selected version.');
  } catch (error) {
    return toActionFailure(error);
  }
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

export async function createSectionAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await requireActor();
  if (!actor) return UNAUTHORIZED;

  const templateId = fdString(formData, 'templateId');
  const parsed = parseWithSchema(sectionCreateSchema, {
    versionId: fdString(formData, 'versionId'),
    parentSectionId: fdString(formData, 'parentSectionId'),
    title: fdString(formData, 'title'),
    sectionNumber: fdString(formData, 'sectionNumber'),
    description: fdString(formData, 'description'),
    sectionType: fdString(formData, 'sectionType'),
    mappingStatus: fdString(formData, 'mappingStatus') ?? 'UNMAPPED',
  });
  if (!parsed.ok) return parsed.failure;

  try {
    await createSection(parsed.data, actor.id);
    revalidateTemplates(templateId);
    return actionSuccess(undefined, 'Section added.');
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function updateSectionAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await requireActor();
  if (!actor) return UNAUTHORIZED;

  const sectionId = fdString(formData, 'sectionId');
  const templateId = fdString(formData, 'templateId');
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
    revalidateTemplates(templateId);
    return actionSuccess(undefined, 'Section saved.');
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function deleteSectionAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await requireActor();
  if (!actor) return UNAUTHORIZED;

  const sectionId = fdString(formData, 'sectionId');
  const templateId = fdString(formData, 'templateId');
  if (!sectionId) return actionFailure('Missing section reference.', 'VALIDATION');

  try {
    await deleteSection(sectionId, actor.id);
    revalidateTemplates(templateId);
    return actionSuccess(undefined, 'Section deleted.');
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function moveSectionAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await requireActor();
  if (!actor) return UNAUTHORIZED;

  const templateId = fdString(formData, 'templateId');
  const parsed = parseWithSchema(sectionMoveSchema, {
    sectionId: fdString(formData, 'sectionId'),
    parentSectionId: fdString(formData, 'parentSectionId'),
    displayOrder: fdString(formData, 'displayOrder'),
  });
  if (!parsed.ok) return parsed.failure;

  try {
    await moveSection(parsed.data, actor.id);
    revalidateTemplates(templateId);
    return actionSuccess(undefined, 'Section moved.');
  } catch (error) {
    return toActionFailure(error);
  }
}

// ---------------------------------------------------------------------------
// Evaluation items
// ---------------------------------------------------------------------------

export async function createEvaluationItemAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await requireActor();
  if (!actor) return UNAUTHORIZED;

  const templateId = fdString(formData, 'templateId');
  const parsed = parseWithSchema(evaluationItemCreateSchema, {
    sectionId: fdString(formData, 'sectionId'),
    description: fdString(formData, 'description'),
    itemNumber: fdString(formData, 'itemNumber'),
    category: fdString(formData, 'category') ?? 'OTHER',
    sourceWording: fdString(formData, 'sourceWording'),
    notes: fdString(formData, 'notes'),
  });
  if (!parsed.ok) return parsed.failure;

  try {
    await createEvaluationItem(parsed.data, actor.id);
    revalidateTemplates(templateId);
    return actionSuccess(undefined, 'Item added.');
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function updateEvaluationItemAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await requireActor();
  if (!actor) return UNAUTHORIZED;

  const itemId = fdString(formData, 'itemId');
  const templateId = fdString(formData, 'templateId');
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
    revalidateTemplates(templateId);
    return actionSuccess(undefined, 'Item saved.');
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function deleteEvaluationItemAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await requireActor();
  if (!actor) return UNAUTHORIZED;

  const itemId = fdString(formData, 'itemId');
  const templateId = fdString(formData, 'templateId');
  if (!itemId) return actionFailure('Missing item reference.', 'VALIDATION');

  try {
    await deleteEvaluationItem(itemId, actor.id);
    revalidateTemplates(templateId);
    return actionSuccess(undefined, 'Item deleted.');
  } catch (error) {
    return toActionFailure(error);
  }
}

// ---------------------------------------------------------------------------
// Competency rules
// ---------------------------------------------------------------------------

export async function createCompetencyRuleAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await requireActor();
  if (!actor) return UNAUTHORIZED;

  const templateId = fdString(formData, 'templateId');
  const parsed = parseWithSchema(competencyRuleCreateSchema, {
    versionId: fdString(formData, 'versionId'),
    sectionId: fdString(formData, 'sectionId'),
    ruleType: fdString(formData, 'ruleType'),
    minimumCorrect: fdString(formData, 'minimumCorrect'),
    minimumPercentage: fdString(formData, 'minimumPercentage'),
    requiredItemNumbers: fdString(formData, 'requiredItemNumbers'),
    sourceWording: fdString(formData, 'sourceWording'),
    notes: fdString(formData, 'notes'),
  });
  if (!parsed.ok) return parsed.failure;

  try {
    await createCompetencyRule(parsed.data, actor.id);
    revalidateTemplates(templateId);
    return actionSuccess(undefined, 'Rule added.');
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function updateCompetencyRuleAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await requireActor();
  if (!actor) return UNAUTHORIZED;

  const ruleId = fdString(formData, 'ruleId');
  const templateId = fdString(formData, 'templateId');
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
    revalidateTemplates(templateId);
    return actionSuccess(undefined, 'Rule saved.');
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function deleteCompetencyRuleAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await requireActor();
  if (!actor) return UNAUTHORIZED;

  const ruleId = fdString(formData, 'ruleId');
  const templateId = fdString(formData, 'templateId');
  if (!ruleId) return actionFailure('Missing rule reference.', 'VALIDATION');

  try {
    await deleteCompetencyRule(ruleId, actor.id);
    revalidateTemplates(templateId);
    return actionSuccess(undefined, 'Rule deleted.');
  } catch (error) {
    return toActionFailure(error);
  }
}

// ---------------------------------------------------------------------------
// Curriculum mapping
// ---------------------------------------------------------------------------

export async function setSectionMappingAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const actor = await requireActor();
  if (!actor) return UNAUTHORIZED;

  const templateId = fdString(formData, 'templateId');
  const parsed = parseWithSchema(sectionMappingSchema, {
    sectionId: fdString(formData, 'sectionId'),
    mappingStatus: fdString(formData, 'mappingStatus'),
    unitIds: fdStringAll(formData, 'unitIds'),
  });
  if (!parsed.ok) return parsed.failure;

  try {
    await setSectionMapping(parsed.data, actor.id);
    revalidateTemplates(templateId);
    return actionSuccess(undefined, 'Curriculum mapping saved.');
  } catch (error) {
    return toActionFailure(error);
  }
}
