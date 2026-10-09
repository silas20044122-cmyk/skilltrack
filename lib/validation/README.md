# Library: Validation (lib/validation)

Zod 4 schemas and FormData helpers shared by every administrative server action.

- `schemas.ts` — one schema per mutation:
  - `institutionSchema`, `departmentSchema`, `programmeSchema`
  - `userCreateSchema`, `userUpdateSchema`, `passwordResetSchema`,
    `userStatusSchema`, `roleAssignmentSchema`
  - `assignmentCreateSchema`, `assignmentUpdateSchema`
  - enums: `roleEnum`, `statusEnum`, `assignmentStatusEnum`
  - `codeField` — trims, validates and uppercases codes
  - empty optional strings are coerced to `undefined`
- `parse.ts`
  - `parseWithSchema(schema, data)` → `{ ok: true, data }` or `{ ok: false, failure }`
    where `failure` is a ready-to-return `ActionFailure` with per-field messages
  - `fdString(formData, key)` / `fdStringAll(formData, key)`

Client-side validation is a convenience only; schemas are always re-parsed
server-side before the database is touched.