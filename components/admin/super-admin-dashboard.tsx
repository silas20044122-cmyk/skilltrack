'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Shield,
  Building,
  CheckCircle2,
  FileCheck2,
  BarChart3,
  Landmark,
} from 'lucide-react';

const NATIONAL_INSTITUTIONS = [
  {
    name: 'Nairobi Technical Polytechnic',
    location: 'Nairobi Region',
    activeAttachees: 420,
    accreditationStatus: 'Fully Accredited (KNQA Level 6)',
    complianceScore: 96,
  },
  {
    name: 'Eldoret National Polytechnic',
    location: 'North Rift Region',
    activeAttachees: 340,
    accreditationStatus: 'Fully Accredited (KNQA Level 6)',
    complianceScore: 94,
  },
  {
    name: 'Mombasa Technical Training Institute',
    location: 'Coast Region',
    activeAttachees: 290,
    accreditationStatus: 'Fully Accredited (KNQA Level 6)',
    complianceScore: 92,
  },
  {
    name: 'Kisumu National Polytechnic',
    location: 'Lake Basin Region',
    activeAttachees: 230,
    accreditationStatus: 'Fully Accredited (KNQA Level 6)',
    complianceScore: 95,
  },
];

export function SuperAdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="p-6 rounded-2xl border border-border bg-card shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>National TVET Quality Assurance Directorate</span>
            <span aria-hidden="true">·</span>
            <span>Ministry of Education TVET Authority</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Dr. Joyce Mutua
          </h1>
          <p className="text-xs text-muted-foreground">
            Director of Industrial Apprenticeships, Occupational Standards & Accreditation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg font-medium border border-emerald-500/20">
            <Shield className="h-4 w-4" />
            National Standards Compliant
          </span>
        </div>
      </div>

      {/* National Overview KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
              Accredited Institutions
            </span>
            <div className="text-2xl font-bold font-mono tabular-nums text-foreground">
              4
            </div>
            <p className="text-[11px] text-muted-foreground">National TVET Polytechnics</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
              Nationwide Attachees
            </span>
            <div className="text-2xl font-bold font-mono tabular-nums text-foreground">
              1,280
            </div>
            <p className="text-[11px] text-muted-foreground">Active in industrial attachments</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
              Host Industry Partners
            </span>
            <div className="text-2xl font-bold font-mono tabular-nums text-foreground">
              164
            </div>
            <p className="text-[11px] text-muted-foreground">Registered employer hosts</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
              National Compliance
            </span>
            <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600">
              98.4%
            </div>
            <p className="text-[11px] text-muted-foreground">Audit verification threshold</p>
          </CardContent>
        </Card>
      </div>

      {/* National Polytechnic Registry Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">National TVET Institutional Registry</CardTitle>
          <CardDescription>
            Multi-tenant oversight of polytechnic attachment compliance, mentor vetting, and curriculum adherence.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
              <tr>
                <th className="p-3.5 font-semibold">TVET Institution</th>
                <th className="p-3.5 font-semibold">Geographical Region</th>
                <th className="p-3.5 font-semibold">Active Attachees</th>
                <th className="p-3.5 font-semibold">Accreditation Status</th>
                <th className="p-3.5 font-semibold">Compliance Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {NATIONAL_INSTITUTIONS.map((inst) => (
                <tr key={inst.name} className="hover:bg-muted/20 transition-colors">
                  <td className="p-3.5">
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      <Landmark className="h-4 w-4 text-primary shrink-0" />
                      <span>{inst.name}</span>
                    </div>
                  </td>
                  <td className="p-3.5 text-muted-foreground">{inst.location}</td>
                  <td className="p-3.5 font-mono tabular-nums font-semibold text-foreground">
                    {inst.activeAttachees} students
                  </td>
                  <td className="p-3.5">
                    <span className="text-emerald-600 font-medium">{inst.accreditationStatus}</span>
                  </td>
                  <td className="p-3.5 font-mono tabular-nums font-semibold text-emerald-600">
                    {inst.complianceScore}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
