# Domain Module: Institutions

Owns the institution and its departments — the top of the
**Institution → Department → Programme → Trainee** hierarchy.

- `service.ts`
  - `getInstitution()` / `getInstitutionOrThrow()`
  - `updateInstitution(institutionId, input, actorId)`
  - `listDepartments()`, `getDepartment(id)`
  - `createDepartment(input, actorId)`, `updateDepartment(id, input, actorId)`
  - `setDepartmentStatus(id, status, actorId)`

The MVP is a single-institution deployment, but the entity is modelled so future
multi-institution support needs no domain redesign. Department codes are unique
per institution (`@@unique([institutionId, code])`).

Consumed by `app/admin/institution` and `app/admin/departments` via server
actions in the same folders. Every mutation emits an audit event and relies on
`toActionFailure` to translate unique/reference/not-found errors.