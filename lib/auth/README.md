# Library: Authentication (lib/auth)

Server-side authentication utilities for SkillTrack (Auth.js v5 + Prisma).

- `password.ts` — bcryptjs hashing/verification (`hashPassword`, `verifyPassword`).
- `user-store.ts` — `authenticateCredentials` (enumeration-safe: password verified
  before account-status is revealed), `resolvePrimaryRole`, `ROLE_PRIORITY` and the
  development-only seed fallback (disabled when `NODE_ENV === 'production'`).
- `session.ts` — server-side gates: `getCurrentUser`, `requireAuth`, `requireRole`,
  `requireAnyRole`.
- `dev-accounts.ts` — client-safe development credential hints for the login page
  quick-fill helper (returns nothing in production builds).

Auth.js configuration lives at the repository root: `auth.config.ts` (shared,
edge-safe callbacks/session config) and `auth.ts` (Credentials provider + handlers).