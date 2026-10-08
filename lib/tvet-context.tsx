'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  UserProfile,
  Attachment,
  LogbookEntry,
  HostCompany,
  SupervisoryVisit,
  CompetencyUnit,
  CompetencyRating,
} from '@/types';
import {
  INITIAL_PROFILES,
  INITIAL_ATTACHMENTS,
  INITIAL_LOGBOOKS,
  INITIAL_HOST_COMPANIES,
  INITIAL_VISITS,
  INITIAL_COMPETENCIES,
} from './mock-data';

interface TvetContextType {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentUser: UserProfile;
  attachments: Attachment[];
  logbooks: LogbookEntry[];
  hostCompanies: HostCompany[];
  visits: SupervisoryVisit[];
  competencies: CompetencyUnit[];
  addLogbookEntry: (entry: {
    title: string;
    description: string;
    trade: string;
    toolsEquipment: string;
    hours: number;
    weekNumber: number;
    dayOfWeek: string;
    date: string;
    competencyTags: string[];
    safetyCompliance: boolean;
    ppeConfirmed: boolean;
    aiFeedback?: string;
  }) => void;
  reviewLogbookEntry: (
    id: string,
    rating: CompetencyRating,
    feedback: string,
    approved: boolean
  ) => void;
  scheduleVisit: (visit: {
    attachmentId: string;
    traineeName: string;
    companyName: string;
    visitDate: string;
    workplaceFindings: string;
    safetyScore: number;
  }) => void;
  assignPlacement: (placement: {
    traineeName: string;
    regNumber: string;
    trade: string;
    companyId: string;
    mentorName: string;
  }) => void;
  resetData: () => void;
}

const TvetContext = createContext<TvetContextType | undefined>(undefined);

export function TvetProvider({ children }: { children: React.ReactNode }) {
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedRole = localStorage.getItem('skilltrack_role');
        if (storedRole) return storedRole as UserRole;
      } catch {
        // Ignore
      }
    }
    return 'TRAINEE';
  });

  const [attachments, setAttachments] = useState<Attachment[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedAtt = localStorage.getItem('skilltrack_attachments');
        if (storedAtt) return JSON.parse(storedAtt);
      } catch {
        // Ignore
      }
    }
    return INITIAL_ATTACHMENTS;
  });

  const [logbooks, setLogbooks] = useState<LogbookEntry[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedLogs = localStorage.getItem('skilltrack_logbooks');
        if (storedLogs) return JSON.parse(storedLogs);
      } catch {
        // Ignore
      }
    }
    return INITIAL_LOGBOOKS;
  });

  const [hostCompanies, setHostCompanies] = useState<HostCompany[]>(INITIAL_HOST_COMPANIES);

  const [visits, setVisits] = useState<SupervisoryVisit[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedVisits = localStorage.getItem('skilltrack_visits');
        if (storedVisits) return JSON.parse(storedVisits);
      } catch {
        // Ignore
      }
    }
    return INITIAL_VISITS;
  });

  const [competencies, setCompetencies] = useState<CompetencyUnit[]>(INITIAL_COMPETENCIES);

  const handleSetRole = (role: UserRole) => {
    setCurrentRole(role);
    try {
      localStorage.setItem('skilltrack_role', role);
    } catch {
      // Ignore
    }
  };

  const addLogbookEntry = (entry: {
    title: string;
    description: string;
    trade: string;
    toolsEquipment: string;
    hours: number;
    weekNumber: number;
    dayOfWeek: string;
    date: string;
    competencyTags: string[];
    safetyCompliance: boolean;
    ppeConfirmed: boolean;
    aiFeedback?: string;
  }) => {
    const newEntry: LogbookEntry = {
      id: `log-${Date.now()}`,
      attachmentId: 'att-001',
      ...entry,
      status: 'SUBMITTED',
    };

    const updated = [newEntry, ...logbooks];
    setLogbooks(updated);

    // Update logged hours on att-001
    setAttachments((prev) =>
      prev.map((att) =>
        att.id === 'att-001'
          ? {
              ...att,
              loggedHours: att.loggedHours + entry.hours,
            }
          : att
      )
    );

    try {
      localStorage.setItem('skilltrack_logbooks', JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const reviewLogbookEntry = (
    id: string,
    rating: CompetencyRating,
    feedback: string,
    approved: boolean
  ) => {
    const updated = logbooks.map((log) => {
      if (log.id === id) {
        return {
          ...log,
          status: approved ? ('APPROVED' as const) : ('REVISION_REQUESTED' as const),
          mentorRating: rating,
          mentorFeedback: feedback,
          reviewedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          reviewedBy: INITIAL_PROFILES.MENTOR.name,
        };
      }
      return log;
    });

    setLogbooks(updated);

    // Recalculate competency score if approved
    if (approved) {
      setAttachments((prev) =>
        prev.map((att) =>
          att.id === 'att-001'
            ? {
                ...att,
                competencyScore: Math.min(100, att.competencyScore + 3),
              }
            : att
        )
      );

      // Verify matching competencies
      setCompetencies((prev) =>
        prev.map((comp) => ({
          ...comp,
          masteryPercent: Math.min(100, comp.masteryPercent + 2),
        }))
      );
    }

    try {
      localStorage.setItem('skilltrack_logbooks', JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const scheduleVisit = (visit: {
    attachmentId: string;
    traineeName: string;
    companyName: string;
    visitDate: string;
    workplaceFindings: string;
    safetyScore: number;
  }) => {
    const newVisit: SupervisoryVisit = {
      id: `vis-${Date.now()}`,
      ...visit,
      iloName: INITIAL_PROFILES.ILO.name,
      status: 'SCHEDULED',
    };

    const updated = [newVisit, ...visits];
    setVisits(updated);
    try {
      localStorage.setItem('skilltrack_visits', JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const assignPlacement = (placement: {
    traineeName: string;
    regNumber: string;
    trade: string;
    companyId: string;
    mentorName: string;
  }) => {
    const company = hostCompanies.find((c) => c.id === placement.companyId) || hostCompanies[0];
    const newAtt: Attachment = {
      id: `att-${Date.now()}`,
      traineeId: `user-t-${Date.now()}`,
      traineeName: placement.traineeName,
      traineeRegNumber: placement.regNumber,
      traineeAvatar: '',
      trade: placement.trade,
      level: 'TVET Level 6',
      institutionName: 'Nairobi Technical Polytechnic',
      hostCompanyId: company.id,
      hostCompanyName: company.name,
      hostLocation: company.location,
      mentorId: `mentor-${Date.now()}`,
      mentorName: placement.mentorName,
      mentorRole: 'Workplace Mentor',
      mentorAvatar: '',
      startDate: '2026-10-15',
      endDate: '2027-01-15',
      totalWeeks: 12,
      completedWeeks: 0,
      loggedHours: 0,
      requiredHours: 480,
      competencyScore: 0,
      status: 'ACTIVE',
    };

    const updated = [newAtt, ...attachments];
    setAttachments(updated);

    // Increment company capacity
    setHostCompanies((prev) =>
      prev.map((c) => (c.id === company.id ? { ...c, activeTrainees: c.activeTrainees + 1 } : c))
    );

    try {
      localStorage.setItem('skilltrack_attachments', JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const resetData = () => {
    setAttachments(INITIAL_ATTACHMENTS);
    setLogbooks(INITIAL_LOGBOOKS);
    setHostCompanies(INITIAL_HOST_COMPANIES);
    setVisits(INITIAL_VISITS);
    setCompetencies(INITIAL_COMPETENCIES);
    setCurrentRole('TRAINEE');
    try {
      localStorage.removeItem('skilltrack_role');
      localStorage.removeItem('skilltrack_logbooks');
      localStorage.removeItem('skilltrack_attachments');
      localStorage.removeItem('skilltrack_visits');
    } catch {
      // Ignore
    }
  };

  const currentUser = INITIAL_PROFILES[currentRole] || INITIAL_PROFILES.TRAINEE;

  return (
    <TvetContext.Provider
      value={{
        currentRole,
        setCurrentRole: handleSetRole,
        currentUser,
        attachments,
        logbooks,
        hostCompanies,
        visits,
        competencies,
        addLogbookEntry,
        reviewLogbookEntry,
        scheduleVisit,
        assignPlacement,
        resetData,
      }}
    >
      {children}
    </TvetContext.Provider>
  );
}

export function useTvet() {
  const ctx = useContext(TvetContext);
  if (!ctx) throw new Error('useTvet must be used within a TvetProvider');
  return ctx;
}
