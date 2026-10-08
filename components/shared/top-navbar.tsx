'use client';

import React from 'react';
import { useTvet } from '@/lib/tvet-context';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import {
  RotateCcw,
  UserCheck,
  Briefcase,
  GraduationCap,
  Building,
  Shield,
  ChevronDown,
} from 'lucide-react';
import Image from 'next/image';

const ROLES_META: {
  role: UserRole;
  label: string;
  badge: string;
  name: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    role: 'TRAINEE',
    label: 'TVET Trainee',
    badge: 'Attachee',
    name: 'Faith Cherono',
    sub: 'Nairobi Tech · Level 6',
    icon: GraduationCap,
  },
  {
    role: 'MENTOR',
    label: 'Workplace Mentor',
    badge: 'Host Supervisor',
    name: 'Martin Ouma',
    sub: 'Apex Mechatronics Ltd',
    icon: Briefcase,
  },
  {
    role: 'ILO',
    label: 'ILO Officer',
    badge: 'Liaison & Placement',
    name: 'Grace Mbandi',
    sub: 'Industry Liaison Office',
    icon: Building,
  },
  {
    role: 'INSTITUTION_ADMIN',
    label: 'Institution Admin',
    badge: 'Polytechnic Dean',
    name: 'Prof. David Koech',
    sub: 'School of Engineering',
    icon: UserCheck,
  },
  {
    role: 'SUPER_ADMIN',
    label: 'Super Admin',
    badge: 'National TVET Directorate',
    name: 'Dr. Joyce Mutua',
    sub: 'TVET Quality Assurance',
    icon: Shield,
  },
];

export function TopNavbar() {
  const { currentRole, setCurrentRole, currentUser, resetData } = useTvet();
  const [roleMenuOpen, setRoleMenuOpen] = React.useState(false);

  const activeMeta = ROLES_META.find((r) => r.role === currentRole) || ROLES_META[0];

  return (
    <header className="border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm tracking-wider shadow-xs">
              ST
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              SkillTrack
            </span>
          </div>
          <span className="hidden sm:inline-block text-xs text-muted-foreground border-l border-border pl-3">
            TVET Workplace Mentoring & Attachment System
          </span>
        </div>

        {/* Zone 2: Role Switcher & Navigation Links */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors text-left"
            aria-label="Switch User Role"
          >
            {currentUser.avatar ? (
              <div className="relative h-6 w-6 rounded-full overflow-hidden shrink-0 border border-border">
                <Image
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-foreground shrink-0">
                {currentUser.name.charAt(0)}
              </div>
            )}
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-foreground leading-tight">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-muted-foreground leading-none">
                {activeMeta.label}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-1" />
          </button>

          {/* Role selection dropdown */}
          {roleMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setRoleMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-lg p-2 z-40 space-y-1">
                <div className="px-3 py-2 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Switch TVET Role Workspace
                </div>
                {ROLES_META.map((item) => {
                  const Icon = item.icon;
                  const isSelected = item.role === currentRole;
                  return (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => {
                        setCurrentRole(item.role);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors ${
                        isSelected
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <div
                        className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold truncate">{item.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{item.badge}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{item.label} · {item.sub}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Zone 3: Quick Action & Demo Reset */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetData}
            title="Reset system demo state to initial defaults"
            className="text-xs text-muted-foreground hover:text-foreground h-8"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            <span className="hidden sm:inline">Reset Demo</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
