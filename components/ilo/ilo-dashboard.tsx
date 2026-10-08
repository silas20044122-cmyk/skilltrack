'use client';

import React, { useState } from 'react';
import { useTvet } from '@/lib/tvet-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Users,
  Calendar,
  CheckCircle2,
  Plus,
  Briefcase,
  MapPin,
  ClipboardCheck,
  Search,
} from 'lucide-react';
import Image from 'next/image';

export function IloDashboard() {
  const { attachments, hostCompanies, visits, scheduleVisit, assignPlacement } = useTvet();

  const [activeTab, setActiveTab] = useState<'placements' | 'companies' | 'visits'>('placements');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isPlacementOpen, setIsPlacementOpen] = useState(false);
  const [isVisitOpen, setIsVisitOpen] = useState(false);

  // New placement form state
  const [newStudentName, setNewStudentName] = useState('');
  const [newRegNumber, setNewRegNumber] = useState('');
  const [newTrade, setNewTrade] = useState('Electrical & Electronics Engineering');
  const [newCompanyId, setNewCompanyId] = useState(hostCompanies[0]?.id || '');
  const [newMentorName, setNewMentorName] = useState('');

  // New visit form state
  const [visitAttId, setVisitAttId] = useState(attachments[0]?.id || '');
  const [visitDate, setVisitDate] = useState('2026-10-18');
  const [visitFindings, setVisitFindings] = useState('');
  const [visitSafetyScore, setVisitSafetyScore] = useState(90);

  const handleCreatePlacement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName || !newRegNumber) return;

    assignPlacement({
      traineeName: newStudentName,
      regNumber: newRegNumber,
      trade: newTrade,
      companyId: newCompanyId,
      mentorName: newMentorName || 'Appointed Workplace Supervisor',
    });

    setNewStudentName('');
    setNewRegNumber('');
    setIsPlacementOpen(false);
  };

  const handleCreateVisit = (e: React.FormEvent) => {
    e.preventDefault();
    const att = attachments.find((a) => a.id === visitAttId) || attachments[0];

    scheduleVisit({
      attachmentId: att.id,
      traineeName: att.traineeName,
      companyName: att.hostCompanyName,
      visitDate,
      workplaceFindings:
        visitFindings || 'Routine TVET supervisory monitoring visit to assess student industrial exposure and safety adherence.',
      safetyScore: Number(visitSafetyScore),
    });

    setVisitFindings('');
    setIsVisitOpen(false);
  };

  const filteredAttachments = attachments.filter(
    (att) =>
      att.traineeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      att.traineeRegNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      att.hostCompanyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* ILO Header */}
      <div className="p-6 rounded-2xl border border-border bg-card shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 rounded-xl overflow-hidden border border-border bg-muted shrink-0">
            <Image
              src="https://picsum.photos/seed/skilltrack-ilo/400/400"
              alt="Grace Mbandi"
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Industry Liaison Office (ILO)</span>
              <span aria-hidden="true">·</span>
              <span>Nairobi Technical Polytechnic</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Grace Mbandi
            </h1>
            <p className="text-xs text-muted-foreground">
              Liaison Director: Corporate Apprenticeships, Industrial MoUs & Placement
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setIsPlacementOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Match New Trainee
          </Button>
          <Button size="sm" variant="outline" onClick={() => setIsVisitOpen(true)}>
            <Calendar className="h-4 w-4 mr-1.5" />
            Schedule Site Visit
          </Button>
        </div>
      </div>

      {/* ILO Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
              Active Attachees
            </span>
            <div className="text-2xl font-bold font-mono tabular-nums text-foreground">
              {attachments.length}
            </div>
            <p className="text-[11px] text-muted-foreground">Across all host engineering firms</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
              Host Companies
            </span>
            <div className="text-2xl font-bold font-mono tabular-nums text-foreground">
              {hostCompanies.length}
            </div>
            <p className="text-[11px] text-muted-foreground">Signed TVET Training Agreements</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
              Supervisory Visits
            </span>
            <div className="text-2xl font-bold font-mono tabular-nums text-foreground">
              {visits.length}
            </div>
            <p className="text-[11px] text-muted-foreground">Site audits & evaluations</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
              Placement Capacity
            </span>
            <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600">
              {hostCompanies.reduce((acc, c) => acc + c.activeTrainees, 0)} /{' '}
              {hostCompanies.reduce((acc, c) => acc + c.maxCapacity, 0)} slots
            </div>
            <p className="text-[11px] text-muted-foreground">Available industry quota</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('placements')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'placements'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Trainee Placements ({attachments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('companies')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'companies'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Partner Employers & MoUs ({hostCompanies.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('visits')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'visits'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Supervisory Site Visits ({visits.length})
          </button>
        </div>

        {activeTab === 'placements' && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search trainee, reg, company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
          </div>
        )}
      </div>

      {/* Tab 1: Placements Table */}
      {activeTab === 'placements' && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                <tr>
                  <th className="p-3.5 font-semibold">Trainee / Reg No</th>
                  <th className="p-3.5 font-semibold">Trade Qualification</th>
                  <th className="p-3.5 font-semibold">Host Employer</th>
                  <th className="p-3.5 font-semibold">Workplace Mentor</th>
                  <th className="p-3.5 font-semibold">Logged Hours</th>
                  <th className="p-3.5 font-semibold">Competency</th>
                  <th className="p-3.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAttachments.map((att) => (
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
                      <div className="text-[11px] text-muted-foreground">{att.hostLocation}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-medium text-foreground">{att.mentorName}</div>
                      <div className="text-[11px] text-muted-foreground">{att.mentorRole}</div>
                    </td>
                    <td className="p-3.5 font-mono tabular-nums">
                      <span className="font-semibold text-foreground">{att.loggedHours}</span> /{' '}
                      {att.requiredHours} hrs
                    </td>
                    <td className="p-3.5 font-mono tabular-nums font-semibold text-emerald-600">
                      {att.competencyScore}%
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded font-medium">
                        <CheckCircle2 className="h-3 w-3" />
                        {att.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Partner Employers & Capacity */}
      {activeTab === 'companies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hostCompanies.map((comp) => {
            const usagePercent = Math.round((comp.activeTrainees / comp.maxCapacity) * 100);
            return (
              <Card key={comp.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base text-foreground">{comp.name}</CardTitle>
                      <CardDescription>{comp.industry}</CardDescription>
                    </div>
                    <span className="text-[11px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded font-medium">
                      MoU {comp.mouStatus}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>{comp.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>Lead Mentor: {comp.leadMentor}</span>
                  </div>

                  {/* Quota Progress */}
                  <div className="space-y-1 pt-2">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Industrial Quota Utilization</span>
                      <span className="font-mono tabular-nums font-semibold text-foreground">
                        {comp.activeTrainees} / {comp.maxCapacity} attachees
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-500"
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tab 3: Supervisory Site Visits */}
      {activeTab === 'visits' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visits.map((vis) => (
              <Card key={vis.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      <span>{vis.visitDate}</span>
                    </div>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                        vis.status === 'COMPLETED'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600'
                      }`}
                    >
                      {vis.status}
                    </span>
                  </div>
                  <CardTitle className="text-base text-foreground mt-1">
                    {vis.companyName}
                  </CardTitle>
                  <CardDescription>Attachee: {vis.traineeName}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <p className="text-muted-foreground leading-relaxed">
                    &quot;{vis.workplaceFindings}&quot;
                  </p>
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="text-muted-foreground">Inspected by: {vis.iloName}</span>
                    <span className="font-mono font-semibold text-emerald-600">
                      Safety Score: {vis.safetyScore}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Match New Trainee Placement */}
      {isPlacementOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-foreground">Match Trainee to Host Industry</h3>
                <p className="text-xs text-muted-foreground">
                  Allocate an approved industrial placement slot and designate workplace supervisor.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPlacementOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePlacement} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Trainee Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dennis Kipchumba"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Institutional Reg Number</label>
                <input
                  type="text"
                  placeholder="e.g. NPT/EEE/2024/0991"
                  value={newRegNumber}
                  onChange={(e) => setNewRegNumber(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Trade Qualification</label>
                <select
                  value={newTrade}
                  onChange={(e) => setNewTrade(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary"
                >
                  <option value="Electrical & Electronics Engineering">Electrical & Electronics Engineering</option>
                  <option value="Mechanical Production (CNC & Machining)">Mechanical Production (CNC & Machining)</option>
                  <option value="Automotive Mechatronics & Diagnostics">Automotive Mechatronics & Diagnostics</option>
                  <option value="Solar PV & Renewable Energy Systems">Solar PV & Renewable Energy Systems</option>
                  <option value="Welding & Fabrication Technology">Welding & Fabrication Technology</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Host Employer Partner</label>
                <select
                  value={newCompanyId}
                  onChange={(e) => setNewCompanyId(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary"
                >
                  {hostCompanies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.activeTrainees}/{c.maxCapacity} slots filled)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Assigned Workplace Mentor Name</label>
                <input
                  type="text"
                  placeholder="e.g. Eng. Martin Ouma or Lead Foreman"
                  value={newMentorName}
                  onChange={(e) => setNewMentorName(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPlacementOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Confirm Placement & Issue Letter
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Schedule Site Visit */}
      {isVisitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-foreground">Schedule TVET Supervisory Site Visit</h3>
                <p className="text-xs text-muted-foreground">
                  Official ILO physical audit of industrial workplace conditions and mentor compliance.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsVisitOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVisit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Select Trainee & Placement</label>
                <select
                  value={visitAttId}
                  onChange={(e) => setVisitAttId(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary"
                >
                  {attachments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.traineeName} ({a.hostCompanyName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Visit Date</label>
                  <input
                    type="date"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Workplace Safety Score (%)</label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={visitSafetyScore}
                    onChange={(e) => setVisitSafetyScore(Number(e.target.value))}
                    className="w-full text-xs p-2 rounded-lg border border-border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Supervisory Agenda / Floor Inspection Focus
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Mid-term review of trainee logbook with mentor Martin Ouma. Audit PPE compliance in machine shop."
                  value={visitFindings}
                  onChange={(e) => setVisitFindings(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsVisitOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Schedule Visit & Notify Employer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
