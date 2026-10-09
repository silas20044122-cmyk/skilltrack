/**
 * SkillTrack — Site & Application Configuration
 * TVET Workplace Mentoring & Attachment Management System
 */

export const siteConfig = {
  name: "SkillTrack",
  fullName: "SkillTrack | TVET Workplace Mentoring & Attachment Management System",
  description:
    "A unified platform for managing TVET trainee industrial attachments, structured workplace mentoring, competency assessments, and institutional oversight.",
  version: "0.1.0",
  sprint: "Sprint 5 — Mentoring Template Engine, Validation, Publishing & Version Management",
  author: "SkillTrack Engineering Team",
  institutionTypes: [
    "National Polytechnic",
    "Technical University",
    "Vocational Training Center",
    "Technical College",
  ] as const,
  /**
   * MVP authorization role codes. These are stable identifiers used by the
   * RBAC layer (see lib/permissions/rbac.ts) — never display labels.
   */
  userRoles: {
    ADMIN: "ADMIN",
    MENTOR: "MENTOR", // Workplace / Industry Mentor
    TRAINEE: "TRAINEE", // TVET Student / Attachee
    ILO: "ILO", // Industry Liaison Officer
  } as const,
};

export type SiteConfig = typeof siteConfig;
