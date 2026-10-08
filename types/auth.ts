/**
 * SkillTrack — Authentication & Authorization Core Types
 * TVET Workplace Mentoring & Attachment Management System
 */

export type RoleCode = 'ADMIN' | 'MENTOR' | 'TRAINEE' | 'ILO';

export type AccountStatus = 'ACTIVE' | 'INACTIVE';

export interface UserRoleRecord {
  role: {
    code: RoleCode;
    name: string;
  };
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  status: AccountStatus;
  roles: RoleCode[];
  primaryRole: RoleCode;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  roles: RoleCode[];
  primaryRole: RoleCode;
  status: AccountStatus;
}

export interface PolicyEvaluation {
  allowed: boolean;
  reason?: string;
  code?: 'UNAUTHENTICATED' | 'FORBIDDEN' | 'INACTIVE_ACCOUNT' | 'AUTHORIZED';
}

export interface RelationshipContext {
  targetTraineeId?: string;
  targetInstitutionId?: string;
  targetAttachmentId?: string;
}
