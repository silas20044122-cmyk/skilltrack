# SkillTrack — Database Architecture

This directory houses SQL scripts, database documentation, and raw schema
migration references for the SkillTrack TVET Workplace Mentoring & Attachment
Management System.

## Engine & ORM
- **Database Engine:** Supabase PostgreSQL
- **Data Access Layer / ORM:** Prisma ORM
- **Prisma source of truth:** `prisma/schema.prisma` + `prisma/migrations/`

## Sprint 2 status — Authentication schema
The database schema now includes the authentication/RBAC foundation:
- `User` (unique email, bcrypt `passwordHash`, `AccountStatus` ACTIVE/INACTIVE)
- `Role` (`RoleType`: ADMIN | MENTOR | TRAINEE | ILO) and `UserRole` (many-to-many)
- `TraineeProfile`, `MentorProfile`, `IloProfile` (one-to-one with `User`)
- Initial migration: `prisma/migrations/0001_init_auth/migration.sql`

See `prisma/README.md` for how to apply migrations. Raw SQL/RLS policies for
later feature sprints belong in `database/sql/`.