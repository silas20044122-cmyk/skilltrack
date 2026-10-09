# Domain Module: Users

Owns user accounts, role assignments and role-specific profiles.

Identity (`User`) is kept **separate** from profiles:

| Role | Profile | Key fields |
| --- | --- | --- |
| TRAINEE | `TraineeProfile` | `registrationNumber`, `programmeId` |
| MENTOR | `MentorProfile` | `companyName`, `jobTitle`, `contactEmail`, `phone` |
| ILO | `IloProfile` | `designation`, `officeEmail`, `institutionId` |

- `listUsers()`, `getUser(id)`, `getUserOrThrow(id)`
- `createUser(input, actorId)` — creates the account, roles and matching profiles
- `updateUser(id, input, actorId)` — updates identity + profiles for the roles the
  user already has (roles are **never** blindly replaced here)
- `setUserStatus(id, status, actorId)` — blocks self-deactivation
- `assignRole(userId, role, actorId)` / `removeRole(userId, role, actorId)` — the
  last role cannot be removed; an admin cannot remove their own ADMIN role
- `resetPassword(id, password, actorId)`
- `listMentorOptions()` / `listTraineeOptions()` — active users for assignment selectors

Consumed by `app/admin/users` (list/new/detail) via server actions that also
handle the role and password forms.