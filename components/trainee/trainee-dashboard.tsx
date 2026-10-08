'use client';

import React, { useState } from 'react';
import { useTvet } from '@/lib/tvet-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Sparkles,
  Wrench,
  ShieldCheck,
  Building2,
  FileCheck2,
  User,
  Star,
  BookOpen,
  Filter,
} from 'lucide-react';

export function TraineeDashboard() {
  const { attachments, logbooks, competencies, addLogbookEntry } = useTvet();
  const currentAttachment = attachments.find((a) => a.id === 'att-001') || attachments[0];

  const [activeTab, setActiveTab] = useState<'logbook' | 'competencies' | 'placement'>('logbook');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);

  // Form states
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [toolsUsed, setToolsUsed] = useState('');
  const [hoursLogged, setHoursLogged] = useState(8);
  const [entryDate, setEntryDate] = useState('2026-10-08');
  const [dayOfWeek, setDayOfWeek] = useState('Thursday');
  const [weekNumber, setWeekNumber] = useState(8);
  const [safetyChecked, setSafetyChecked] = useState(true);
  const [ppeChecked, setPpeChecked] = useState(true);

  // AI Assistance state
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    competencies?: string[];
    technicalRefinement?: string;
    mentorNotes?: string;
    suggestedHoursRating?: number;
  } | null>(null);

  const handleAiAnalyze = async () => {
    if (!taskDescription.trim()) return;
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/gemini/analyze-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityTitle: taskTitle || 'Workplace Task',
          activityDescription: taskDescription,
          toolsUsed,
          trade: currentAttachment.trade,
        }),
      });
      const data = await res.json();
      setAiAnalysis(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmitEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !taskDescription) return;

    addLogbookEntry({
      title: taskTitle,
      description: taskDescription,
      trade: currentAttachment.trade,
      toolsEquipment: toolsUsed || 'Standard workshop hand tools and measuring instruments',
      hours: Number(hoursLogged),
      weekNumber: Number(weekNumber),
      dayOfWeek,
      date: entryDate,
      competencyTags:
        aiAnalysis?.competencies && aiAnalysis.competencies.length > 0
          ? aiAnalysis.competencies
          : ['Workplace Safety Procedures', 'Standard Operating Procedures', 'Hands-on Execution'],
      safetyCompliance: safetyChecked,
      ppeConfirmed: ppeChecked,
      aiFeedback: aiAnalysis?.technicalRefinement,
    });

    // Reset and close
    setTaskTitle('');
    setTaskDescription('');
    setToolsUsed('');
    setAiAnalysis(null);
    setIsNewEntryOpen(false);
  };

  // Filter logs for this attachment
  const myLogs = logbooks.filter((l) => l.attachmentId === currentAttachment.id);
  const filteredLogs = myLogs.filter((log) => {
    if (filterStatus === 'ALL') return true;
    return log.status === filterStatus;
  });

  const hoursProgress = Math.round(
    (currentAttachment.loggedHours / currentAttachment.requiredHours) * 100
  );

  return (
    <div className="space-y-8">
      {/* Top Trainee Industrial Placement Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-border bg-card shadow-xs">
        <div className="relative h-44 sm:h-52 w-full bg-slate-900">
          <Image
            src="https://picsum.photos/seed/skilltrack-workshop/1600/600"
            alt="TVET Industrial Automation Training Workshop"
            fill
            className="object-cover opacity-35"
            priority
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

          {/* Banner Overlaid Metadata */}
          <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden border-2 border-background shadow-md bg-muted shrink-0">
                <Image
                  src={currentAttachment.traineeAvatar || 'https://picsum.photos/seed/skilltrack-trainee/400/400'}
                  alt={currentAttachment.traineeName}
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{currentAttachment.traineeRegNumber}</span>
                  <span aria-hidden="true">·</span>
                  <span>{currentAttachment.level}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {currentAttachment.traineeName}
                </h1>
                <p className="text-xs text-muted-foreground truncate max-w-lg">
                  {currentAttachment.trade}
                </p>
              </div>
            </div>

            <Button
              onClick={() => setIsNewEntryOpen(true)}
              size="sm"
              className="shrink-0 font-medium"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Log Daily Work
            </Button>
          </div>
        </div>

        {/* Placement Key Metrics Bar */}
        <div className="p-4 sm:p-6 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-border bg-muted/20">
          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
              Host Industry
            </span>
            <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">{currentAttachment.hostCompanyName}</span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">{currentAttachment.hostLocation}</p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
              Workplace Mentor
            </span>
            <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
              <User className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">{currentAttachment.mentorName}</span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">{currentAttachment.mentorRole}</p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
              Attachment Hours
            </span>
            <div className="font-semibold text-sm text-foreground font-mono tabular-nums">
              {currentAttachment.loggedHours} / {currentAttachment.requiredHours} hrs
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-500"
                style={{ width: `${Math.min(100, hoursProgress)}%` }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
              Competency Mastery
            </span>
            <div className="font-semibold text-sm text-foreground font-mono tabular-nums flex items-center gap-1.5">
              <span>{currentAttachment.competencyScore}%</span>
              <span className="text-xs font-normal text-emerald-600 font-sans">
                (Week {currentAttachment.completedWeeks}/{currentAttachment.totalWeeks})
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-full transition-all duration-500"
                style={{ width: `${currentAttachment.competencyScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Trainee Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('logbook')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'logbook'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Daily & Weekly Logbooks ({myLogs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('competencies')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'competencies'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            TVET Occupational Standards ({competencies.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('placement')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'placement'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Attachment Contract & Details
          </button>
        </div>

        {activeTab === 'logbook' && (
          <div className="flex items-center gap-1 text-xs">
            <Filter className="h-3.5 w-3.5 text-muted-foreground mr-1" />
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                filterStatus === 'ALL'
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('SUBMITTED')}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                filterStatus === 'SUBMITTED'
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              In Review
            </button>
            <button
              onClick={() => setFilterStatus('APPROVED')}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                filterStatus === 'APPROVED'
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Approved
            </button>
          </div>
        )}
      </div>

      {/* Tab 1: Logbook Feed */}
      {activeTab === 'logbook' && (
        <div className="space-y-4">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-xl">
              <FileCheck2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <h3 className="text-sm font-semibold text-foreground">No logbook entries match filter</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Click &quot;Log Daily Work&quot; to record your trade activities.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((entry) => {
                const isApproved = entry.status === 'APPROVED';
                const isSubmitted = entry.status === 'SUBMITTED';

                return (
                  <Card key={entry.id} className="transition-all hover:border-foreground/20">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Week {entry.weekNumber}</span>
                            <span aria-hidden="true">·</span>
                            <span>{entry.dayOfWeek}</span>
                            <span aria-hidden="true">·</span>
                            <span>{entry.date}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums font-medium text-foreground">
                              {entry.hours} hrs
                            </span>
                          </div>
                          <CardTitle className="text-base font-semibold text-foreground">
                            {entry.title}
                          </CardTitle>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isApproved && (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md font-medium">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Approved by Mentor
                            </span>
                          )}
                          {isSubmitted && (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md font-medium">
                              <Clock className="h-3.5 w-3.5" />
                              Pending Mentor Sign-off
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-0">
                      <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                        {entry.description}
                      </p>

                      {/* Equipment and Tools Used */}
                      {entry.toolsEquipment && (
                        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/50">
                          <Wrench className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                          <div>
                            <span className="font-medium text-foreground">Tools & Equipment: </span>
                            <span>{entry.toolsEquipment}</span>
                          </div>
                        </div>
                      )}

                      {/* Competency Tags */}
                      {entry.competencyTags && entry.competencyTags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[11px] text-muted-foreground mr-1">Competencies:</span>
                          {entry.competencyTags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[11px] text-foreground/80 bg-muted px-2 py-0.5 rounded border border-border/60"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Mentor Feedback Section if present */}
                      {isApproved && entry.mentorFeedback && (
                        <div className="border-t border-border pt-3 mt-3 space-y-2 bg-emerald-500/5 -mx-6 -mb-6 p-4 rounded-b-xl border-t">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                                M
                              </div>
                              <span className="text-xs font-semibold text-foreground">
                                Mentor Feedback ({entry.reviewedBy})
                              </span>
                              <span className="text-[11px] text-muted-foreground">· {entry.reviewedAt}</span>
                            </div>

                            {entry.mentorRating && (
                              <div className="flex items-center gap-1 text-amber-500 text-xs font-mono">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${
                                      i < (entry.mentorRating || 0)
                                        ? 'fill-amber-500 text-amber-500'
                                        : 'text-muted-foreground/30'
                                    }`}
                                  />
                                ))}
                                <span className="ml-1 text-[11px] font-semibold text-foreground">
                                  Rating: {entry.mentorRating}/5
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-foreground/80 italic pl-7">
                            &quot;{entry.mentorFeedback}&quot;
                          </p>
                        </div>
                      )}

                      {/* AI Assistance Feedback if present */}
                      {entry.aiFeedback && (
                        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/15 text-xs text-muted-foreground">
                          <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                          <div>
                            <span className="font-semibold text-primary">TVET Standards Guidance: </span>
                            <span>{entry.aiFeedback}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: TVET Occupational Standards */}
      {activeTab === 'competencies' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>TVET National Occupational Standards (NOS) Matrix</CardTitle>
              <CardDescription>
                Competencies mapped to KNQA Level 6 Diploma in Electrical & Electronics Engineering.
                Verified by workplace host supervisor.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {competencies.map((comp) => (
                <div
                  key={comp.code}
                  className="p-4 rounded-xl border border-border bg-card space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                        <span className="font-semibold text-primary">{comp.code}</span>
                        <span aria-hidden="true">·</span>
                        <span>Level {comp.level}</span>
                      </div>
                      <h4 className="font-semibold text-sm text-foreground">{comp.title}</h4>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold tabular-nums">
                          {comp.masteryPercent}%
                        </div>
                        <div className="text-[10px] text-muted-foreground">Mastery</div>
                      </div>
                      {comp.verifiedByMentor ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Mentor Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          In Progress
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">{comp.description}</p>

                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        comp.masteryPercent >= 80 ? 'bg-emerald-600' : 'bg-primary'
                      }`}
                      style={{ width: `${comp.masteryPercent}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 3: Attachment Contract & Placement Details */}
      {activeTab === 'placement' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Host Industry Profile</CardTitle>
              <CardDescription>Industrial placement details and host supervisor allocation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Host Company:</span>
                <span className="font-medium text-foreground">{currentAttachment.hostCompanyName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Location:</span>
                <span className="font-medium text-foreground">{currentAttachment.hostLocation}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Assigned Mentor:</span>
                <span className="font-medium text-foreground">
                  {currentAttachment.mentorName} ({currentAttachment.mentorRole})
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Institution:</span>
                <span className="font-medium text-foreground">{currentAttachment.institutionName}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Liaison Officer (ILO):</span>
                <span className="font-medium text-foreground">Grace Mbandi</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statutory TVET Attachment Terms</CardTitle>
              <CardDescription>National compliance criteria for TVET diploma award.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium text-foreground">12 Weeks (480 Contact Hours)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Commencement Date:</span>
                <span className="font-medium text-foreground">{currentAttachment.startDate}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Expected Completion:</span>
                <span className="font-medium text-foreground">{currentAttachment.endDate}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Attendance Policy:</span>
                <span className="font-medium text-foreground">Minimum 90% logged on-site hours</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Insurance & Safety:</span>
                <span className="font-medium text-emerald-600">Covered under TVET Institutional Policy</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal / Slide-over: New Daily Log Entry Form */}
      {isNewEntryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-foreground">Log Daily Trade Activities</h3>
                <p className="text-xs text-muted-foreground">
                  Record your hands-on tasks, machinery utilized, and safety procedures for mentor sign-off.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewEntryOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitEntry} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Date</label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Day of Week</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary"
                  >
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Hours Logged</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={hoursLogged}
                    onChange={(e) => setHoursLogged(Number(e.target.value))}
                    className="w-full text-xs p-2 rounded-lg border border-border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Task / Activity Title</label>
                <input
                  type="text"
                  placeholder="e.g. PLC Step-7 Ladder Logic Calibration and Sensor Loop Check"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground">
                    Technical Activity Description & Procedures Followed
                  </label>
                  <button
                    type="button"
                    onClick={handleAiAnalyze}
                    disabled={isAiLoading || !taskDescription.trim()}
                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 font-medium disabled:opacity-50"
                  >
                    <Sparkles className="h-3 w-3" />
                    {isAiLoading ? 'Analyzing...' : 'AI TVET Competency Assistant'}
                  </button>
                </div>
                <textarea
                  rows={4}
                  placeholder="Describe step-by-step what technical procedures you performed, safety steps taken (e.g. LOTO, PPE), components tested, and measurements recorded..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary leading-relaxed"
                  required
                />
              </div>

              {/* AI Guidance Box if triggered */}
              {aiAnalysis && (
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>TVET National Occupational Standards (NOS) Alignment</span>
                  </div>
                  {aiAnalysis.technicalRefinement && (
                    <p className="text-foreground/90">{aiAnalysis.technicalRefinement}</p>
                  )}
                  {aiAnalysis.competencies && aiAnalysis.competencies.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {aiAnalysis.competencies.map((c) => (
                        <span
                          key={c}
                          className="bg-primary/10 text-primary text-[10px] font-medium px-2 py-0.5 rounded"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Tools, Machinery & Measuring Instruments Used
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fluke 87V Multimeter, Siemens S7-1200 PLC, Insulated torque screwdrivers"
                  value={toolsUsed}
                  onChange={(e) => setToolsUsed(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Safety Compliance & PPE Checklist */}
              <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
                <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Workplace Safety & OSHA Compliance Declarations</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={safetyChecked}
                      onChange={(e) => setSafetyChecked(e.target.checked)}
                      className="rounded border-border text-primary"
                    />
                    <span>Followed standard lockout/tagout & safety rules</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ppeChecked}
                      onChange={(e) => setPpeChecked(e.target.checked)}
                      className="rounded border-border text-primary"
                    />
                    <span>Wore mandatory PPE (boots, goggles, vest)</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsNewEntryOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Submit to Mentor for Sign-off
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
