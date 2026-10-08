/**
 * SkillTrack — Global TVET Domain Types
 * TVET Workplace Mentoring & Attachment Management System
 */

export type UserRole =
  | 'SUPER_ADMIN'
  | 'INSTITUTION_ADMIN'
  | 'ILO' // Industry Liaison Officer
  | 'MENTOR' // Workplace Mentor
  | 'TRAINEE'; // TVET Student / Attachee

export type AttachmentStatus =
  | 'PENDING_APPROVAL'
  | 'ACTIVE'
  | 'ON_LEAVE'
  | 'COMPLETED'
  | 'TERMINATED';

export type LogbookStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REVISION_REQUESTED';

export type CompetencyRating = 1 | 2 | 3 | 4 | 5;

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  institution?: string;
  department?: string;
  organization?: string;
  designation?: string;
}

export interface Attachment {
  id: string;
  traineeId: string;
  traineeName: string;
  traineeRegNumber: string;
  traineeAvatar: string;
  trade: string;
  level: string;
  institutionName: string;
  hostCompanyId: string;
  hostCompanyName: string;
  hostLocation: string;
  mentorId: string;
  mentorName: string;
  mentorRole: string;
  mentorAvatar: string;
  startDate: string;
  endDate: string;
  totalWeeks: number;
  completedWeeks: number;
  loggedHours: number;
  requiredHours: number;
  competencyScore: number;
  status: AttachmentStatus;
}

export interface LogbookEntry {
  id: string;
  attachmentId: string;
  weekNumber: number;
  dayOfWeek: string;
  date: string;
  hours: number;
  title: string;
  description: string;
  trade: string;
  toolsEquipment: string;
  competencyTags: string[];
  safetyCompliance: boolean;
  ppeConfirmed: boolean;
  evidenceImageUrl?: string;
  status: LogbookStatus;
  mentorRating?: CompetencyRating;
  mentorFeedback?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  aiFeedback?: string;
}

export interface HostCompany {
  id: string;
  name: string;
  industry: string;
  location: string;
  activeTrainees: number;
  maxCapacity: number;
  mouStatus: 'ACTIVE' | 'PENDING_RENEWAL';
  leadMentor: string;
  contactEmail: string;
}

export interface SupervisoryVisit {
  id: string;
  attachmentId: string;
  traineeName: string;
  companyName: string;
  iloName: string;
  visitDate: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'REPORT_FILED';
  workplaceFindings: string;
  safetyScore: number;
}

export interface CompetencyUnit {
  code: string;
  title: string;
  trade: string;
  level: number;
  masteryPercent: number;
  verifiedByMentor: boolean;
  description: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
