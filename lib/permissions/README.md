# Library: Permissions & RBAC (lib/permissions)

Centralized, reusable authorization policies for SkillTrack. Authorization is
enforced server-side (never by hiding UI alone).

- `rbac.ts`:
  - `ROUTE_PERMISSIONS` — route prefix → required roles (`/admin`, `/mentor`,
    `/trainee`, `/ilo`).
  - `hasRole` / `hasAnyRole` / `hasAllRoles` — role evaluation (active accounts only).
  - `canAccessRoute` — route access policy returning `AUTHORIZED`, `UNAUTHENTICATED`,
    `INACTIVE_ACCOUNT` or `FORBIDDEN`.
  - `getDefaultLandingPath` — deterministic role landing page.
  - `canAccessTraineeRecord` — forward-compatible **relationship-based** policy stub
    (ADMIN/ILO global oversight, trainee self-access, mentor-assignment context).

MVP role codes: `ADMIN`, `MENTOR`, `TRAINEE`, `ILO` (stable identifiers, never labels).