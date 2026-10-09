# Prisma Directory

Data models, datasource configuration and migration history for SkillTrack.

## Models

- Auth / RBAC: `User`, `Role`, `UserRole` (many-to-many), `AccountStatus` enum.
- Profiles: `TraineeProfile` (`registrationNumber`, `programmeId`),
  `MentorProfile` (`contactEmail`, `phone`), `IloProfile` (`designation`,
  `institutionId`). Profile/identity separation is intentional.
- Organization: `Institution` → `Department` → `Programme`; codes are unique per
  institution (`Department @@unique([institutionId, code])`, `Programme`
  denormalizes `institutionId` for institution-wide code uniqueness).
- Relationships: `MentorAssignment` (mentor, trainee, `assignedBy`, `status`,
  `startDate`, `endDate`, `notes`).
- Enums: `RoleType` (`ADMIN | MENTOR | TRAINEE | ILO`), `AccountStatus` /
  `StatusType` (`ACTIVE | INACTIVE`), `AssignmentStatus` (`ACTIVE | ENDED`).

### Sprint 4 — Curriculum, documents & templates

- `CurriculumUnit` — configurable competency area of a programme; unique by
  `(programmeId, code)`.
- `SourceDocument` — an uploaded mentoring-tool PDF. Stores only a `storageKey`
  (binary lives in object storage), plus hash/size/status.
- `ExtractionRun` — append-only record of every Gemini extraction attempt
  (`rawResponse`, `structuredOutput`, `status`, `model`, `promptVersion`).
- `MentoringTemplate` → `MentoringTemplateVersion` — versioned template
  definitions (`DRAFT | IN_REVIEW | READY_FOR_PUBLISH | PUBLISHED | ARCHIVED`).
- `TemplateSection` (self-referencing hierarchy), `EvaluationItem`,
  `CompetencyRule`, `TemplateSectionCurriculumUnit` (mapping),
  `TemplateVersionWarning`.
- Enums: `SourceDocumentStatus`, `ExtractionRunStatus`, `TemplateVersionStatus`,
  `EvaluationCategory`, `MappingStatus`, `CompetencyRuleType`.

### Sprint 5 — Template engine, validation & publishing

- `TemplateVersionStatus` renamed to `DRAFT | IN_REVIEW | READY_FOR_PUBLISH |
  PUBLISHED | ARCHIVED` (migration renames enum values in place — no data loss).
- `MentoringTemplateVersion` extended with `basedOnVersionId`, `revision`,
  `validatedById/At`, `publishedById/At`, `archivedAt`.
- `TemplateValidationRun` + `TemplateValidationIssue` — immutable, field-level
  validation records (ruleset version, revision, severity, entity references).
- `MentoringTemplate.sourceDocumentId` — one template per uploaded PDF.
- Enums: `ValidationRunStatus` (`PASSED | FAILED`), `ValidationIssueSeverity`
  (`ERROR | WARNING | INFO`).

## Migration history

| Migration | Sprint |
| --- | --- |
| `0001_init_auth` | 1–2 |
| `0002_sprint3_institution_user_management` | 3 |
| `0003_sprint4_curriculum_documents_templates` | 4 |
| `0004_sprint5_template_engine` | 5 |

## Files

- `schema.prisma` — the schema above.
- `migrations/` — version-controlled migration history.
- `seed.ts` — development seed (`npm run db:seed`) creating the institution,
  departments, programmes, users/profiles, sample assignments and the ICT
  Level 6 curriculum units.

## Applying migrations

With a reachable database configured in `.env` (`DATABASE_URL` + `DIRECT_URL`):

```bash
npx prisma migrate dev --name <migration>   # create + apply during development
npx prisma migrate deploy                   # apply committed migrations
npx prisma generate                         # regenerate Prisma Client
npm run db:seed                             # load development seed data
```

> Use `DIRECT_URL` for the CLI (session connection). The pooled `DATABASE_URL`
> must use `postgres.<project-ref>` as the username — see `.env.example`.

> Development seed credentials are for local/testing use only. See the root README.