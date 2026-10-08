# SkillTrack | TVET Workplace Mentoring & Attachment Management System

**SkillTrack** is an institutional management platform designed for Technical and Vocational Education and Training (TVET) institutions. It streamlines and unifies trainee industrial attachments, workplace mentoring oversight, supervisor assessments, and compliance reporting across TVET polytechnics and industry host employers.

---

## Technology Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 + PostCSS
- **UI Components:** shadcn/ui primitives (`@base-ui/react`, `class-variance-authority`, `lucide-react`)
- **Code Quality:** ESLint (`eslint-config-next`)
- **Version Control:** Git
- **Target Database (Sprint 1 — Task 2):** Supabase PostgreSQL + Prisma ORM

---

## Architectural Topology: Modular Monolith

SkillTrack is organized as a domain-centric **modular monolith**. All user roles (Super Admin, Institution Admin, ILO, Mentor, and Trainee) interact within a single, cohesive codebase with future role-based authorization gates:

```text
skilltrack/
├── app/                  # Next.js App Router (Layouts, routes, route groups)
│   ├── (auth)/           # Authentication flows (login, reset, invitations)
│   ├── (dashboard)/      # Role-based dashboard interfaces
│   ├── api/              # Backend Route Handlers
│   ├── layout.tsx        # Root HTML layout & font configuration
│   └── page.tsx          # Application shell & foundation verification
├── components/           # Reusable UI components
│   ├── ui/               # shadcn/ui primitives (Button, Card, Badge)
│   └── shared/           # Cross-cutting composite UI components
├── config/               # System configuration & constants (site.ts)
├── database/             # Database architecture documentation & raw SQL
│   ├── sql/              # RLS policies and migration scripts
│   └── README.md
├── lib/                  # Shared utilities and core libraries
│   ├── auth/             # Session and authentication helpers
│   ├── db/               # Database client singletons (Prisma client)
│   ├── permissions/      # RBAC permission rules
│   ├── utils/            # General helper utilities
│   └── validation/       # Schema validators
├── modules/              # Domain business logic (modular monolith)
│   ├── assessments/      # Workplace & institutional evaluations
│   ├── attachments/      # Trainee placements & mentor allocations
│   ├── institutions/     # TVET colleges & polytechnic administration
│   ├── programmes/       # Vocational curricula & trades
│   ├── reports/          # Compliance summaries & audit logs
│   ├── templates/        # Logbook & rubric templates
│   └── users/            # User identity & profile handling
├── prisma/               # Reserved for Prisma schema & migrations (Task 2)
├── types/                # Strict TypeScript global definitions
├── .env.example          # Environment variable documentation template
├── .gitignore            # Strict repository exclusions
└── README.md             # Project documentation
```

---

## Local Development Requirements

- **Node.js:** v20.x or higher
- **Package Manager:** `npm` (v10+ recommended)
- **Operating System:** Linux, macOS, or Windows WSL2

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create your local environment file by copying the template:

```bash
cp .env.example .env.local
```

Populate the required values in `.env.local` as needed. (Note: database credentials will be configured in Sprint 1 — Task 2).

### 3. Run Development Server

```bash
npm run dev
```

The application will be accessible at [http://localhost:3000](http://localhost:3000).

### 4. Code Quality & Linting

```bash
npm run lint
```

### 5. Type Checking

```bash
npx tsc --noEmit
```

### 6. Production Build

```bash
npm run build
```

---

## Current Status: Sprint 1 — Prompt 1 Complete

- [x] Next.js 15 App Router configured with strict TypeScript
- [x] Tailwind CSS v4 and PostCSS pipeline configured
- [x] shadcn/ui initialized with core UI primitives
- [x] Modular monolith domain folder structure established
- [x] Environment configuration template (`.env.example`) documented
- [x] Git repository exclusions (`.gitignore`) configured
- [x] Prisma directory reserved for upcoming schema integration
- [x] Application shell verifying foundation readiness

---

## What Has Intentionally NOT Been Implemented Yet

To maintain disciplined sprint velocity and adhere strictly to Sprint 1 Prompt 1 scope, the following capabilities are **deferred to upcoming tasks**:

- **Database Connection & Models:** Supabase PostgreSQL connection, Prisma schema, and migrations (scheduled for **Sprint 1 — Prompt 2**).
- **Authentication:** Sign-in, session tokens, passwords, and Auth.js integration.
- **RBAC & Authorization:** Role permission matrix execution.
- **Business Features:** Logbook entry, mentor assignments, PDF uploads, Gemini document extraction, competency calculations, and ILO placement workflows.
