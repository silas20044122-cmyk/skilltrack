import { z } from 'zod';

// Entity id references. The seeded development data uses stable non-UUID ids
// (e.g. `prog_dict_l6`, `inst_001`), so ids are validated as non-empty strings
// rather than strict UUIDs.
const idString = (message = 'Select a valid option.') => z.string().trim().min(1, message);

/**
 * Centralised server-side validation schemas (zod v4).
 *
 * Every administrative mutation parses its input through one of these schemas
 * before touching the database. Client-side validation is a convenience only.
 */

const emptyToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

export const roleEnum = z.enum(['ADMIN', 'MENTOR', 'TRAINEE', 'ILO']);
export const statusEnum = z.enum(['ACTIVE', 'INACTIVE']);
export const assignmentStatusEnum = z.enum(['ACTIVE', 'ENDED']);

export const codeField = z
  .string()
  .trim()
  .min(2, 'Code must be at least 2 characters.')
  .max(24, 'Code must be at most 24 characters.')
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, 'Use letters, numbers, dot, dash or underscore.')
  .transform((v) => v.toUpperCase());

const nameField = z.string().trim().min(2, 'Name is required.').max(160);

const optionalText = z.preprocess(
  emptyToUndefined,
  z.string().trim().max(500).optional()
);

const optionalEmail = z.preprocess(
  emptyToUndefined,
  z.email('Enter a valid email address.').max(200).optional()
);

const optionalDate = z.preprocess(
  emptyToUndefined,
  z.coerce.date().optional()
);

// ---------------------------------------------------------------------------
// Institution / Department / Programme
// ---------------------------------------------------------------------------

export const institutionSchema = z.object({
  name: nameField,
  code: codeField,
  description: optionalText,
  email: optionalEmail,
  phone: z.preprocess(emptyToUndefined, z.string().trim().max(40).optional()),
  address: optionalText,
});

export const departmentSchema = z.object({
  name: nameField,
  code: codeField,
  description: optionalText,
});

export const programmeSchema = z.object({
  departmentId: idString('Select a valid department.'),
  name: nameField,
  code: codeField,
  level: z.preprocess(emptyToUndefined, z.string().trim().max(40).optional()),
  description: optionalText,
});

// ---------------------------------------------------------------------------
// Users, roles and profiles
// ---------------------------------------------------------------------------

export const userCreateSchema = z.object({
  name: nameField,
  email: z.email('Enter a valid email address.').max(200),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(100, 'Password is too long.'),
  status: statusEnum.default('ACTIVE'),
  roles: z.array(roleEnum).min(1, 'Select at least one role.'),

  // Role-specific profile fields (all optional; only used for matching roles).
  registrationNumber: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(60).optional()
  ),
  programmeId: z.preprocess(emptyToUndefined, idString().optional()),

  companyName: z.preprocess(emptyToUndefined, z.string().trim().max(160).optional()),
  jobTitle: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
  contactEmail: optionalEmail,
  phone: z.preprocess(emptyToUndefined, z.string().trim().max(40).optional()),

  designation: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
  officeEmail: optionalEmail,
  institutionId: z.preprocess(emptyToUndefined, idString().optional()),
});

export const userUpdateSchema = userCreateSchema.omit({ password: true, roles: true });

export const passwordResetSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters.').max(100),
});

export const userStatusSchema = z.object({ status: statusEnum });

export const roleAssignmentSchema = z.object({ role: roleEnum });

// ---------------------------------------------------------------------------
// Mentor-trainee assignments
// ---------------------------------------------------------------------------

export const assignmentCreateSchema = z.object({
  mentorId: idString('Select a valid mentor.'),
  traineeId: idString('Select a valid trainee.'),
  notes: optionalText,
  startDate: optionalDate,
});

export const assignmentUpdateSchema = z.object({
  status: assignmentStatusEnum,
  notes: optionalText,
  endDate: optionalDate,
});

// ---------------------------------------------------------------------------
// Sprint 4 — Curriculum units
// ---------------------------------------------------------------------------

const optionalLongText = z.preprocess(
  emptyToUndefined,
  z.string().trim().max(6000).optional()
);

export const curriculumUnitSchema = z.object({
  programmeId: idString('Select a valid programme.'),
  name: nameField,
  code: codeField,
  description: optionalLongText,
  position: z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).optional()),
});

export const curriculumUnitUpdateSchema = curriculumUnitSchema.omit({ programmeId: true });

// ---------------------------------------------------------------------------
// Sprint 4 — Source documents
// ---------------------------------------------------------------------------

export const sourceDocumentUploadSchema = z.object({
  programmeId: idString('Select a valid programme.'),
});

// Direct-to-storage upload: the browser requests a signed target, uploads the
// PDF itself, then finalizes with the resulting key + hash.
export const sourceDocumentUploadTargetSchema = z.object({
  programmeId: idString('Select a valid programme.'),
  fileName: z.string().trim().min(1, 'Select a PDF file to upload.').max(255),
  mimeType: z.string().trim().max(120).default('application/pdf'),
  size: z.coerce.number().int().positive('Select a PDF file to upload.'),
});

export const sourceDocumentFinalizeSchema = sourceDocumentUploadTargetSchema.extend({
  storageKey: z.string().trim().min(1).max(512),
  fileHash: z
    .string()
    .trim()
    .regex(/^[a-f0-9]{64}$/i, 'The file fingerprint is invalid.'),
});

// ---------------------------------------------------------------------------
// Sprint 4 — Extracted template editing, mapping and validation
// ---------------------------------------------------------------------------

export const mappingStatusEnum = z.enum(['UNMAPPED', 'MAPPED', 'NOT_APPLICABLE']);
export const evaluationCategoryEnum = z.enum([
  'KNOWLEDGE',
  'SKILL',
  'ATTITUDE',
  'OTHER',
]);
export const competencyRuleTypeEnum = z.enum([
  'MINIMUM_COUNT',
  'MINIMUM_PERCENTAGE',
  'REQUIRED_ITEMS',
  'COMPOSITE',
  'OTHER',
]);

export const sectionUpdateSchema = z.object({
  title: nameField,
  sectionNumber: z.preprocess(emptyToUndefined, z.string().trim().max(50).optional()),
  description: optionalLongText,
  sectionType: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
  mappingStatus: mappingStatusEnum,
});

export const evaluationItemUpdateSchema = z.object({
  description: z.string().trim().min(1, 'Description is required.').max(4000),
  itemNumber: z.preprocess(emptyToUndefined, z.string().trim().max(50).optional()),
  category: evaluationCategoryEnum,
  sourceWording: z.preprocess(emptyToUndefined, z.string().trim().max(4000).optional()),
  notes: optionalLongText,
});

export const competencyRuleUpdateSchema = z.object({
  ruleType: competencyRuleTypeEnum,
  minimumCorrect: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(0).optional()
  ),
  minimumPercentage: z.preprocess(
    emptyToUndefined,
    z.coerce.number().min(0).max(100).optional()
  ),
  requiredItemNumbers: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(2000).optional()
  ),
  sourceWording: z.string().trim().min(1, 'Source wording is required.').max(4000),
  notes: optionalLongText,
});

export const sectionMappingSchema = z.object({
  sectionId: idString('Select a valid section.'),
  mappingStatus: mappingStatusEnum,
  unitIds: z.array(idString()).default([]),
});

export const versionValidateSchema = z.object({
  versionId: idString('Select a valid version.'),
  notes: optionalLongText,
});

// ---------------------------------------------------------------------------
// Sprint 5 — Template lifecycle, structure editing, validation and publishing
// ---------------------------------------------------------------------------

export const templateVersionStatusEnum = z.enum([
  'DRAFT',
  'IN_REVIEW',
  'READY_FOR_PUBLISH',
  'PUBLISHED',
  'ARCHIVED',
]);

const optionalInt = z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).optional());

export const templateCreateSchema = z.object({
  programmeId: idString('Select a valid programme.'),
  title: nameField,
  description: optionalLongText,
});

export const templateUpdateSchema = z.object({
  title: nameField,
  description: optionalLongText,
});

export const sectionCreateSchema = sectionUpdateSchema.extend({
  versionId: idString('Select a valid template version.'),
  parentSectionId: z.preprocess(emptyToUndefined, idString().optional()),
  displayOrder: optionalInt,
});

export const sectionMoveSchema = z.object({
  sectionId: idString('Select a valid section.'),
  parentSectionId: z.preprocess(emptyToUndefined, idString().optional()),
  displayOrder: optionalInt,
});

export const evaluationItemCreateSchema = evaluationItemUpdateSchema.extend({
  sectionId: idString('Select a valid section.'),
  displayOrder: optionalInt,
});

export const competencyRuleCreateSchema = competencyRuleUpdateSchema.extend({
  versionId: idString('Select a valid template version.'),
  sectionId: z.preprocess(emptyToUndefined, idString().optional()),
  displayOrder: optionalInt,
});

export const versionTransitionSchema = z.object({
  versionId: idString('Select a valid version.'),
  to: templateVersionStatusEnum,
});

export const versionPublishSchema = z.object({
  versionId: idString('Select a valid version.'),
});

export const versionCloneSchema = z.object({
  sourceVersionId: idString('Select a valid version.'),
});

export type InstitutionInput = z.infer<typeof institutionSchema>;
export type DepartmentInput = z.infer<typeof departmentSchema>;
export type ProgrammeInput = z.infer<typeof programmeSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type AssignmentCreateInput = z.infer<typeof assignmentCreateSchema>;
export type AssignmentUpdateInput = z.infer<typeof assignmentUpdateSchema>;

export type CurriculumUnitInput = z.infer<typeof curriculumUnitSchema>;
export type CurriculumUnitUpdateInput = z.infer<typeof curriculumUnitUpdateSchema>;
export type SourceDocumentUploadInput = z.infer<typeof sourceDocumentUploadSchema>;
export type SourceDocumentUploadTargetInput = z.infer<typeof sourceDocumentUploadTargetSchema>;
export type SourceDocumentFinalizeInput = z.infer<typeof sourceDocumentFinalizeSchema>;
export type SectionUpdateInput = z.infer<typeof sectionUpdateSchema>;
export type EvaluationItemUpdateInput = z.infer<typeof evaluationItemUpdateSchema>;
export type CompetencyRuleUpdateInput = z.infer<typeof competencyRuleUpdateSchema>;
export type SectionMappingInput = z.infer<typeof sectionMappingSchema>;
export type VersionValidateInput = z.infer<typeof versionValidateSchema>;

export type TemplateCreateInput = z.infer<typeof templateCreateSchema>;
export type TemplateUpdateInput = z.infer<typeof templateUpdateSchema>;
export type SectionCreateInput = z.infer<typeof sectionCreateSchema>;
export type SectionMoveInput = z.infer<typeof sectionMoveSchema>;
export type EvaluationItemCreateInput = z.infer<typeof evaluationItemCreateSchema>;
export type CompetencyRuleCreateInput = z.infer<typeof competencyRuleCreateSchema>;
export type VersionTransitionInput = z.infer<typeof versionTransitionSchema>;
export type VersionPublishInput = z.infer<typeof versionPublishSchema>;
export type VersionCloneInput = z.infer<typeof versionCloneSchema>;