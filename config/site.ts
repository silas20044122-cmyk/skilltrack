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
  sprint: "Sprint 1 — Foundation",
  author: "SkillTrack Engineering Team",
  institutionTypes: [
    "National Polytechnic",
    "Technical University",
    "Vocational Training Center",
    "Technical College",
  ] as const,
  userRoles: {
    SUPER_ADMIN: "SUPER_ADMIN",
    INSTITUTION_ADMIN: "INSTITUTION_ADMIN",
    ILO: "ILO", // Industry Liaison Officer
    MENTOR: "MENTOR", // Workplace / Industry Mentor
    TRAINEE: "TRAINEE", // TVET Student / Attachee
  } as const,
};

export type SiteConfig = typeof siteConfig;
