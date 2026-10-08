'use client';

import React from 'react';
import { useTvet } from '@/lib/tvet-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  GraduationCap,
  Building,
  Download,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Award,
} from 'lucide-react';

export function InstitutionAdminDashboard() {
  const { attachments, hostCompanies, logbooks } = useTvet();

  const totalRequiredHours = attachments.reduce((acc, a) => acc + a.requiredHours, 0);
  const totalLoggedHours = attachments.reduce((acc, a) => acc + a.loggedHours, 0);
  const avgCompetency = Math.round(
    attachments.reduce((acc, a) => acc + a.competencyScore, 0) / (attachments.length || 1)
  );

  // Generate real CSV audit report for TVET Quality Assurance
  const handleDownloadCsv = () => {
    const headers = [
      'Trainee Name',
      'Registration Number',
      'Trade Qualification',
      'Host Employer',
      'Assigned Mentor',
      'Logged Hours',
      'Required Hours',
      'Completion %',
      'Competency Score %',
      'Attachment Status',
    ];

    const rows = attachments.map((att) => [
      `"${att.traineeName}"`,
      `"${att.traineeRegNumber}"`,
      `"${att.trade}"`,
      `"${att.hostCompanyName}"`,
      `"${att.mentorName}"`,
      att.loggedHours,
      att.requiredHours,
      `${Math.round((att.loggedHours / att.requiredHours) * 100)}%`,
      `${att.competencyScore}%`,
      `"${att.status}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `TVET_Attachment_Compliance_Report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="p-6 rounded-2xl border border-border bg-card shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Institutional Governance</span>
            <span aria-hidden="true">·</span>
            <span>Nairobi Technical Polytechnic</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Prof. David Koech
          </h1>
          <p className="text-xs text-muted-foreground">
            Dean, School of Engineering & Applied Technical Disciplines
          </p>
        </div>

        <Button size="sm" onClick={handleDownloadCsv} className="shrink-0">
          <Download className="h-4 w-4 mr-1.5" />
          Export TVET Audit CSV
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
              Enrolled Attachees
            </span>
            <div className="text-2xl font-bold font-mono tabular-nums text-foreground">
              {attachments.length}
            </div>
            <p className="text-[11px] text-muted-foreground">Current 2026 industrial cohort</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
              Industrial Partners
            </span>
            <div className="text-2xl font-bold font-mono tabular-nums text-foreground">
              {hostCompanies.length}
            </div>
            <p className="text-[11px] text-muted-foreground">MoU accredited host employers</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
              Hours Accomplished
            </span>
            <div className="text-2xl font-bold font-mono tabular-nums text-foreground">
              {totalLoggedHours} / {totalRequiredHours}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {Math.round((totalLoggedHours / totalRequiredHours) * 100)}% institutional progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
              Cohort Competency Avg
            </span>
            <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600">
              {avgCompetency}%
            </div>
            <p className="text-[11px] text-muted-foreground">National standards threshold: 75%</p>
          </CardContent>
        </Card>
      </div>

      {/* Programmatic Performance Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Electrical & Automation</CardTitle>
            <CardDescription>Diploma Level 6 (KNQA)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Attachees Placed:</span>
              <span className="font-semibold text-foreground">1 Student (Apex Mechatronics)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Weekly Hours:</span>
              <span className="font-mono font-semibold text-foreground">40.0 hrs/wk</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Supervisor Sign-offs:</span>
              <span className="text-emerald-600 font-medium">95% on-time</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Mechanical Production</CardTitle>
            <CardDescription>CNC & Precision Machining</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Attachees Placed:</span>
              <span className="font-semibold text-foreground">1 Student (Standard Metalworks)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Weekly Hours:</span>
              <span className="font-mono font-semibold text-foreground">40.0 hrs/wk</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Supervisor Sign-offs:</span>
              <span className="text-emerald-600 font-medium">90% on-time</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Clean Energy & Solar</CardTitle>
            <CardDescription>Microgrids & Installation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Attachees Placed:</span>
              <span className="font-semibold text-foreground">1 Student (Rift Valley Solar)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Weekly Hours:</span>
              <span className="font-mono font-semibold text-foreground">40.0 hrs/wk</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Supervisor Sign-offs:</span>
              <span className="text-emerald-600 font-medium">88% on-time</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cohort Attachment Audit Roster */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3">
          <div>
            <CardTitle className="text-base">Institutional Attachment Audit Roster</CardTitle>
            <CardDescription>
              Real-time monitoring of workplace logbooks, mentor compliance, and completion hours.
            </CardDescription>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {attachments.length} records active
          </span>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
              <tr>
                <th className="p-3.5 font-semibold">Trainee / Reg No</th>
                <th className="p-3.5 font-semibold">Trade Qualification</th>
                <th className="p-3.5 font-semibold">Host Employer & Mentor</th>
                <th className="p-3.5 font-semibold">Hours Logged</th>
                <th className="p-3.5 font-semibold">Competency</th>
                <th className="p-3.5 font-semibold">TVET Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {attachments.map((att) => {
                const percent = Math.round((att.loggedHours / att.requiredHours) * 100);
                return (
                  <tr key={att.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3.5">
                      <div className="font-semibold text-foreground">{att.traineeName}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {att.traineeRegNumber}
                      </div>
                    </td>
                    <td className="p-3.5 text-muted-foreground max-w-xs truncate">{att.trade}</td>
                    <td className="p-3.5">
                      <div className="font-medium text-foreground">{att.hostCompanyName}</div>
                      <div className="text-[11px] text-muted-foreground">
                        Mentor: {att.mentorName}
                      </div>
                    </td>
                    <td className="p-3.5 font-mono tabular-nums">
                      <span className="font-semibold text-foreground">{att.loggedHours}</span> /{' '}
                      {att.requiredHours} hrs
                      <span className="text-muted-foreground ml-1">({percent}%)</span>
                    </td>
                    <td className="p-3.5 font-mono tabular-nums font-semibold text-emerald-600">
                      {att.competencyScore}%
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded font-medium">
                        <CheckCircle2 className="h-3 w-3" />
                        Compliant
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
