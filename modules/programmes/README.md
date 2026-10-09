# Domain Module: Programmes

Owns TVET programmes (curricula/trades/qualification levels) that belong to a
department.

- `listProgrammes()` — programmes with department + trainee counts
- `getProgramme(id)`
- `listProgrammeOptions()` — active programmes for selectors
- `createProgramme(input, actorId)`, `updateProgramme(id, input, actorId)`
- `setProgrammeStatus(id, status, actorId)`

`Programme.institutionId` is denormalized from the department so programme codes
are unique **per institution** (`@@unique([institutionId, code])`) rather than
globally. Moving a programme to another department re-resolves `institutionId`.

Consumed by `app/admin/programmes` and by the trainee selector in
`app/admin/users`.