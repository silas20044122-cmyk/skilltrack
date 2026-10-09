# Domain Module: Templates

Houses mentoring-template definitions and their version history. A programme may
own **many templates**; each uploaded PDF owns exactly one template (keyed by
`MentoringTemplate.sourceDocumentId`), and re-extracting the same document adds a
new numbered draft to that document's template. Versions are never overwritten in
place.

## Version lifecycle

`DRAFT ⇄ IN_REVIEW → READY_FOR_PUBLISH → PUBLISHED → ARCHIVED`

- **DRAFT** — editable working copy. `createTemplate` starts here.
- **IN_REVIEW** — editable, submitted for review. Optional.
- **READY_FOR_PUBLISH** — validation passed and the version is frozen. No longer
  editable; publishing re-runs validation immediately before it becomes live.
- **PUBLISHED** — immutable and consumable. At most one published version per
  template; publishing a new version archives the previous one automatically.
- **ARCHIVED** — superseded or manually retired; retained for history.

Changing a published version requires cloning it into a new numbered `DRAFT`
(`createDraftFromVersion`), recorded via `basedOnVersionId`. Transitions that skip
validation (e.g. `DRAFT → READY_FOR_PUBLISH`, or any direct `→ PUBLISHED`) are
rejected with `INVALID_STATE`; publishing must go through the publish service.

## Validation

`validation.ts` is the single source of truth (`TEMPLATE_RULESET_VERSION =
'1.0.0'`). It returns structured, field-level issues (severity `ERROR | WARNING |
INFO`) covering metadata, sections (incl. cycles), items, rules (percentage range,
minimum-vs-item-count, required-item resolution) and cross-programme mappings. It
is generic: no department, section count, category or formula is hard-coded.

Every explicit validation and every publish attempt (pass or fail) is persisted as
an immutable `TemplateValidationRun` (+ `TemplateValidationIssue`), recording the
exact draft `revision` that was validated.

## Publishing and versions

- `publishing.ts` — `publishTemplateVersion` (transactional, re-validates,
  publishes in place under a `Serializable` transaction and archives the previous
  published version) and `createDraftFromVersion` (deep-clones sections, items,
  rules, mapping and parent hierarchy into a new draft).
- `service.ts` — reads, authoring, structure editing, consumption
  (`getCurrentPublishedVersion`, `getPublishedTemplatesForProgramme`,
  `getPublishedTemplateStructure`) and lifecycle transitions.
- Consumption only ever serves a `PUBLISHED` version; drafts are rejected.

## Structure

- `TemplateSection` — arbitrary hierarchy via `parentSectionId`; add/delete/move.
- `EvaluationItem` — category (`KNOWLEDGE|SKILL|ATTITUDE|OTHER`), item number and
  verbatim `sourceWording`.
- `CompetencyRule` — `MINIMUM_COUNT | MINIMUM_PERCENTAGE | REQUIRED_ITEMS |
  COMPOSITE | OTHER`, at section or version level.
- `TemplateSectionCurriculumUnit` — section ↔ curriculum-unit mapping (same
  programme only).
- `TemplateVersionWarning` — extraction/semantic warnings surfaced during review.

## Editing rules

Only `DRAFT` and `IN_REVIEW` versions are editable (`service.ts`); every mutation
bumps `revision`. Once `READY_FOR_PUBLISH` or `PUBLISHED`, edits are rejected with
`INVALID_STATE` and a new draft must be cloned. All mutations sit behind an admin
guard and emit audit events (`TEMPLATE_*`, `CURRICULUM_MAPPING_CHANGED`).

## Admin UI

- `/admin/templates` — all templates with their current published version.
- `/admin/templates/[templateId]` — version list, validation, publish, clone and
  transition actions.
- `/admin/templates/[templateId]/versions/[versionId]` — full structure editor and
  lifecycle controls for a single version.
