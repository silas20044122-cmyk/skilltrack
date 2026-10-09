# Domain Module: Assignments

Owns mentor → trainee assignments as first-class relationship records.

`MentorAssignment` carries `status` (`ACTIVE | ENDED`), `startDate`, `endDate`,
`notes` and the assigning actor (`assignedById`). This preserves assignment
history instead of storing a single `mentorId` on the trainee.

- `listAssignments()` — mentor/trainee/profile details included
- `createAssignment(input, actorId)`
  - rejects self-assignment
  - verifies the mentor has the MENTOR role and the trainee the TRAINEE role
  - rejects duplicate **active** assignments for the same pair
- `updateAssignment(id, input, actorId)` — end (sets `endDate`) or reactivate

Consumed by `app/admin/assignments` (list/new). Relationship helpers used later
for access checks live in `lib/permissions/relationships.ts`.