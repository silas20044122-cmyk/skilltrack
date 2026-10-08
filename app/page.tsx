'use client';

import React from 'react';
import { TvetProvider, useTvet } from '@/lib/tvet-context';
import { TopNavbar } from '@/components/shared/top-navbar';
import { TraineeDashboard } from '@/components/trainee/trainee-dashboard';
import { MentorDashboard } from '@/components/mentor/mentor-dashboard';
import { IloDashboard } from '@/components/ilo/ilo-dashboard';
import { InstitutionAdminDashboard } from '@/components/admin/institution-admin-dashboard';
import { SuperAdminDashboard } from '@/components/admin/super-admin-dashboard';
import { siteConfig } from '@/config/site';

function MainAppShell() {
  const { currentRole } = useTvet();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Bar with Top Bar Contract & Role Switcher */}
      <TopNavbar />

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">
        {currentRole === 'TRAINEE' && <TraineeDashboard />}
        {currentRole === 'MENTOR' && <MentorDashboard />}
        {currentRole === 'ILO' && <IloDashboard />}
        {currentRole === 'INSTITUTION_ADMIN' && <InstitutionAdminDashboard />}
        {currentRole === 'SUPER_ADMIN' && <SuperAdminDashboard />}
      </main>

      {/* Quiet, Clean Footer */}
      <footer className="border-t border-border py-6 mt-auto bg-card/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">{siteConfig.name}</span>
            <span aria-hidden="true">·</span>
            <span>TVET Workplace Mentoring & Industrial Attachment Management System</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>National TVET Occupational Standards (KNQA) Compliant</span>
            <span aria-hidden="true">·</span>
            <span>Version {siteConfig.version}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function HomePage() {
  return (
    <TvetProvider>
      <MainAppShell />
    </TvetProvider>
  );
}
