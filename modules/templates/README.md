# Domain Module: Templates

Houses mentoring-template definitions and their version history. Each extraction
from a source document creates a new `MentoringTemplateVersion`; a template is
never overwritten in place.

## Version lifecycle

`EXTRACTION_DRAFT → VALIDATED → PUBLISHED → ARCHIVED`

- **EXTRACTION_DRAFT** — an unreviewed extraction result. The only editable
  state.
- **VALIDATED** — reviewed and frozen by an administrator. Ready for Sprint 5's
  publishing workflow (not built here).
- **PUBLISHED / ARCHIVED** — reserved for a later sprint.

## Structure

- `TemplateSection` — supports arbitrary hierarchy via `parentSectionId`.
- `EvaluationItem` — category (`KNOWLEDGE|SKILL|ATTITUDE|OTHER`), item number and
  the verbatim `sourceWording`.
- `CompetencyRule` — `MINIMUM_COUNT | MINIMUM_PERCENTAGE | REQUIRED_ITEMS |
  COMPOSITE | OTHER`, at section or version level.
- `TemplateSectionCurriculumUnit` — section ↔ curriculum-unit mapping.
- `TemplateVersionWarning` — extraction/semantic warnings surfaced during review.

## Editing rules

Only `EXTRACTION_DRAFT` versions are editable (`service.ts`). Once validated, all
edits are rejected with `INVALID_STATE`; a new extraction is required to change
a definition. All mutations are behind an admin guard and emit audit events
(`TEMPLATE_DATA_EDITED`, `CURRICULUM_MAPPING_CHANGED`, `EXTRACTION_VALIDATED`).
