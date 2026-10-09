# SkillTrack | TVET Workplace Mentoring & Attachment Management System

**SkillTrack** is an institutional management platform designed for Technical and Vocational Education and Training (TVET) institutions. It streamlines trainee industrial attachments, workplace mentoring oversight, supervisor assessments, and compliance reporting across TVET polytechnics and industry host employers.

---

## Technology Stack

- **Framework:** Next.js 16.4 (App Router)
- **Language:** TypeScript 5.9 (strict mode)
- **Styling:** Tailwind CSS v4 + PostCSS
- **UI Components:** shadcn/ui primitives (`@base-ui/react`, `class-variance-authority`, `lucide-react`)
- **Auth:** Auth.js v5 (`next-auth@5.0.0-beta.32`) + Credentials provider, JWT session strategy
- **Database:** Supabase PostgreSQL + Prisma ORM (schema + migrations)
- **Password Security:** bcryptjs
- **Code Quality:** ESLint 9 + `eslint-config-next@16`
- **Type Checking:** TypeScript `tsc --noEmit`
- **Testing:** Custom offline + HTTP test suites (`scripts/test-auth-rbac.ts`, `scripts/test-auth-http.ts`, `scripts/test-admin.ts`)
- **Validation:** Zod 4 schemas shared by all server actions (`lib/validation/schemas.ts`)

---

## Authentication Architecture

SkillTrack implements a secure, single-login authentication and authorization foundation.

- **Single shared login:** One login page at `/login` (no `/register`, `/signup`, or public registration).
- **Credentials flow:** Auth.js Credentials provider with bcrypt password hashing; JWT sessions (30-day max age).
- **Session propagation:** JWT callbacks copy `id`, `email`, `name`, `roles`, `primaryRole`, `status` to the token; session callbacks propagate them to `session.user`. No passwords or password hashes ever enter the session.
- **Account status:** `ACTIVE` | `INACTIVE`; inactive accounts are blocked at the credential validation step. Password verification occurs before the inactive check to prevent email/account enumeration.
- **Multi-role support:** Users may have multiple roles (normalized via `UserRole` join); primary role is deterministically resolved by priority (`ADMIN > ILO > MENTOR > TRAINEE`). `getDefaultLandingPath` maps the primary role to its portal.
- **Server-side authorization:** Centralized RBAC in `lib/permissions/rbac.ts` (`canAccessRoute`, `hasRole`, `hasAnyRole`, `canAccessTraineeRecord`). `lib/auth/session.ts` provides `requireAuth`, `requireRole`, `requireAnyRole` (redirecting to `/login` or `/unauthorized`).
- **Route protection:** `middleware.ts` (edge-safe — imports only `auth.config.ts`) evaluates policies, blocks unauthenticated/protected routes, and redirects `/login`/`/dashboard` to the user's role landing page. Role pages (`/admin`, `/mentor`, `/trainee`, `/ilo`) enforce authorization server-side.
- **Development mode safety:** A dev-only fallback to the in-memory seed user store exists in `lib/auth/user-store.ts` but is disabled in `production`. The login page shows a non-production-only quick-fill helper for seed accounts.

**Development test accounts (local only):**

| Role | Email | Password | Status |
|---|---|---|---|
| ADMIN | admin@skilltrack.gov.tvet | AdminPass123! | ACTIVE |
| MENTOR | mentor@workplace.co.ke | MentorPass123! | ACTIVE |
| TRAINEE | trainee@polytechnic.ac.ke | TraineePass123! | ACTIVE |
| ILO | ilo@institute.ac.ke | IloPass123! | ACTIVE |
| ADMIN+ILO (Coordinator) | coordinator@polytechnic.ac.ke | CoordPass123! | ACTIVE |
| INACTIVE (Trainee) | inactive@polytechnic.ac.ke | InactivePass123! | INACTIVE |

*Do not use these credentials in production. See `.env.example` for configuration.*

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` (or `.env`) and populate `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, and other required values.

```bash
copy .env.example .env
```

### 3. Run Development Server

```bash
npm run dev
```

The application is accessible at [http://localhost:3000](http://localhost:3000). The root `/` redirects to `/login`.

### 4. Code Quality & Linting

```bash
npm run lint
```

### 5. Type Checking

```bash
npm run typecheck
```

### 6. Tests

```bash
npm run test:auth         # offline authentication & RBAC suite
npm run test:auth:server  # HTTP integration suite (boots the app)
npm run test:admin        # Sprint 3 administrative validation/error-mapping suite
npm test                  # all of the above
```

### 7. Database (Supabase PostgreSQL + Prisma)

```bash
npm run db:seed                              # seed institution, departments, programmes, users
npx prisma migrate dev --name <migration>    # create/apply a migration (requires DIRECT_URL)
```

> **Supabase pooler note:** the pooled connection string must use
> `postgres.<project-ref>` as the username (not just `postgres`), otherwise the
> pooler returns `(ENOIDENTIFIER) no tenant identifier provided`. See `.env.example`.

### 8. Production Build (typecheck enforced)

```bash
npm run build
```

---

## Institution & User Management (Sprint 3)

All administrative mutations are **Server Actions** that run through a single
pipeline: `getAdminUser()` guard → zod parse → domain service → audit hook →
`revalidatePath`. Errors are translated to safe `ActionResult`s by
`toActionFailure` (no raw database messages ever reach the client).

The organizational hierarchy is **Institution → Department → Programme → Trainee**.
Programme codes are unique per institution (denormalized `Programme.institutionId`).
Mentor↔trainee links are first-class `MentorAssignment` records (status, dates,
notes, assigning actor), so assignment history is preserved.

Admin routes (ADMIN-only, guarded in `app/admin/layout.tsx`):

| Route | Purpose |
| --- | --- |
| `/admin` | Overview with live counts |
| `/admin/institution` | Edit the institution |
| `/admin/departments` (+ `/new`, `/[id]/edit`) | Department CRUD + activate/deactivate |
| `/admin/programmes` (+ `/new`, `/[id]/edit`) | Programme CRUD + activate/deactivate |
| `/admin/users` (+ `/new`, `/[id]`) | User CRUD, add/remove roles, reset password, activate/deactivate |
| `/admin/assignments` (+ `/new`) | Assign mentors to trainees; end/reactivate assignments |

## Project Structure (relevant to Sprints 2–3)

```text
app/
├── api/auth/[...nextauth]/    # Auth.js route handlers
├── login/                    # Shared login page + server action
├── dashboard/                # Auth-gated redirect to role landing
├── admin/                    # ADMIN-only management area
│   ├── layout.tsx            # requireRole('ADMIN') + AdminShell
│   ├── page.tsx              # Overview
│   ├── institution/          # Edit institution (page + actions + client form)
│   ├── departments/          # List/new/edit + actions
│   ├── programmes/           # List/new/edit + actions
│   ├── users/                # List/new/[id] + actions, role & password forms
│   └── assignments/          # List/new + actions
├── mentor/ · trainee/ · ilo/ # Role landing pages
├── unauthorized/             # Access denied page
└── page.tsx                  # Redirects to /login (mock demo retired)

auth.ts, auth.config.ts, proxy.ts   # Next 16 proxy (was middleware.ts)

components/
├── admin/                    # AdminShell, form-ui, confirm-submit, page-parts
└── ui/                       # Base UI primitives (button, input, select, dialog, ...)

lib/
├── actions/result.ts         # ActionResult contract
├── audit/log-audit-event.ts  # Audit hook (persistence in a later sprint)
├── auth/                     # password, session, guards, user-store
├── db/prisma.ts              # Prisma client singleton
├── errors.ts                 # AppError + Prisma → ActionResult mapping
├── permissions/rbac.ts       # Route+relationship RBAC policies
└── validation/               # zod schemas + FormData parsing helpers

modules/                      # Domain services (institutions, programmes, users, assignments)
prisma/                       # schema.prisma + seed.ts + migrations
types/                        # Auth.js augmentation + core auth/RBAC types
```

---

## Sprint 2 Status: Complete (authentication + RBAC foundation)

- [x] Auth.js v5 integration with Next.js App Router, JWT strategy
- [x] Single shared `/login`; no public registration
- [x] Password hashing via bcryptjs; enumeration-safe credential validation; inactive-account enforcement
- [x] Centralized RBAC utilities + server-side `requireAuth`/`requireRole` guards
- [x] Next 16 `proxy.ts` enforcing route protection and post-login landing
- [x] Multi-role with deterministic priority; relationship-based policy scaffold
- [x] Session safety; dev seed data; `test:auth` + `test:auth:server`

## Sprint 3 Status: Institution & User Management

- [x] Institution, Department, Programme management with server-verified authorization
- [x] Programme code uniqueness per institution
- [x] User management: create/edit/deactivate, add/remove roles (never blind replacement), password reset
- [x] Role-specific profiles (Trainee `registrationNumber`, Mentor contact info, ILO designation)
- [x] Mentor-trainee assignments with status/dates/notes and history
- [x] Shared admin shell, forms, confirm dialogs, empty/error states
- [x] Audit hooks on every mutation; safe error translation
- [x] `test:admin` validation/error-mapping suite; lint + typecheck + build

**Deferred:** invitation/email workflow, attachment/PDF/Gemini/template/assessment/evidence/action-plan/ILO sign-off/report workflows.
