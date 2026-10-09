# Dashboard Route Group: app/(dashboard)

Reserved route group for unified role-gated dashboards.

**Sprint 2 status:** minimal, server-protected role landing pages already exist
as real routes — `/admin`, `/mentor`, `/trainee`, `/ilo` and `/dashboard`
(which redirects to the user's primary-role landing). Each is enforced by
`requireRole`/`requireAuth`. Full business dashboards belong to later sprints.