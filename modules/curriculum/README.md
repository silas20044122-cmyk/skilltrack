# Domain Module: Curriculum

Curriculum units are the configurable competency areas of a programme. They are
**data**, not code: the ICT test case's 11 units are seeded in
`prisma/seed.ts`, and administrators manage them through the UI.

Every unit is unique by `(programmeId, code)`. During template review, extracted
sections are mapped onto units, which later sprints use for competency
evaluation and reporting.

## Files

- `service.ts` — list/create/update/activate/deactivate units.

## Invariants

- Unit codes are unique within a programme.
- Units are never hard-coded in application logic; departments can define their
  own vocabulary.
