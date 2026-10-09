import { z } from 'zod';

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
  departmentId: z.uuid('Select a valid department.'),
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
  programmeId: z.preprocess(emptyToUndefined, z.uuid().optional()),

  companyName: z.preprocess(emptyToUndefined, z.string().trim().max(160).optional()),
  jobTitle: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
  contactEmail: optionalEmail,
  phone: z.preprocess(emptyToUndefined, z.string().trim().max(40).optional()),

  designation: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
  officeEmail: optionalEmail,
  institutionId: z.preprocess(emptyToUndefined, z.uuid().optional()),
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
  mentorId: z.uuid('Select a valid mentor.'),
  traineeId: z.uuid('Select a valid trainee.'),
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
  programmeId: z.uuid('Select a valid programme.'),
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
  programmeId: z.uuid('Select a valid programme.'),
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
  sectionId: z.uuid('Select a valid section.'),
  mappingStatus: mappingStatusEnum,
  unitIds: z.array(z.uuid()).default([]),
});

export const versionValidateSchema = z.object({
  versionId: z.uuid('Select a valid version.'),
  notes: optionalLongText,
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
export type SectionUpdateInput = z.infer<typeof sectionUpdateSchema>;
export type EvaluationItemUpdateInput = z.infer<typeof evaluationItemUpdateSchema>;
export type CompetencyRuleUpdateInput = z.infer<typeof competencyRuleUpdateSchema>;
export type SectionMappingInput = z.infer<typeof sectionMappingSchema>;
export type VersionValidateInput = z.infer<typeof versionValidateSchema>;