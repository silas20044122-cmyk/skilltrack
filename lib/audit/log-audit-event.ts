/**
 * SkillTrack — Audit hook (see README for the future persistence plan).
 */

export type AuditAction =
  | 'USER_CREATE'
  | 'USER_ROLE_ASSIGN'
  | 'USER_ROLE_REMOVE'
  | 'USER_UPDATE'
  | 'USER_STATUS_CHANGE'
  | 'INSTITUTION_UPDATE'
  | 'DEPARTMENT_CREATE'
  | 'DEPARTMENT_UPDATE'
  | 'PROGRAMME_CREATE'
  | 'PROGRAMME_UPDATE'
  | 'ASSIGNMENT_CREATE'
  | 'ASSIGNMENT_STATUS_CHANGE'
  | 'CURRICULUM_UNIT_CREATE'
  | 'CURRICULUM_UNIT_UPDATE'
  | 'SOURCE_DOCUMENT_UPLOADED'
  | 'SOURCE_DOCUMENT_DELETED'
  | 'EXTRACTION_STARTED'
  | 'EXTRACTION_COMPLETED'
  | 'EXTRACTION_FAILED'
  | 'TEMPLATE_DATA_EDITED'
  | 'CURRICULUM_MAPPING_CHANGED'
  | 'EXTRACTION_VALIDATED';

export interface AuditEvent {
  action: AuditAction;
  actorId?: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Lightweight audit hook.
 *
 * Sprint 3 does not implement the full audit-log subsystem. Instead every
 * operation that will eventually require auditing is routed through this single
 * function so that a persistent audit store can be attached later without
 * touching call sites. It intentionally never throws.
 */
export function logAuditEvent(event: AuditEvent): void {
  try {
    console.info(
      '[audit]',
      JSON.stringify({ ...event, at: new Date().toISOString() })
    );
  } catch {
    // Auditing must never break a request.
  }
}