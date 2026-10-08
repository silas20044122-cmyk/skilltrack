'use client';

import React, { useState } from 'react';
import { useTvet } from '@/lib/tvet-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CompetencyRating, LogbookEntry } from '@/types';
import Image from 'next/image';
import {
  CheckCircle2,
  Clock,
  Star,
  ShieldCheck,
  FileCheck,
  UserCheck,
  Building2,
  Calendar,
  AlertTriangle,
  Award,
} from 'lucide-react';

export function MentorDashboard() {
  const { attachments, logbooks, reviewLogbookEntry } = useTvet();

  // Active mentor data
  const mentorAttachment = attachments.find((a) => a.id === 'att-001') || attachments[0];
  const pendingLogs = logbooks.filter((l) => l.status === 'SUBMITTED');
  const approvedLogs = logbooks.filter((l) => l.status === 'APPROVED');

  const [reviewingLog, setReviewingLog] = useState<LogbookEntry | null>(null);
  const [rating, setRating] = useState<CompetencyRating>(4);
  const [feedback, setFeedback] = useState('');
  const [safetyVerified, setSafetyVerified] = useState(true);

  const openReviewModal = (entry: LogbookEntry) => {
    setReviewingLog(entry);
    setRating(4);
    setFeedback(
      'Demonstrated sound understanding of industrial safety protocols and standard operating procedures. Clean execution.'
    );
    setSafetyVerified(true);
  };

  const handleApprove = () => {
    if (!reviewingLog) return;
    reviewLogbookEntry(reviewingLog.id, rating, feedback, true);
    setReviewingLog(null);
  };

  const handleRequestRevision = () => {
    if (!reviewingLog) return;
    reviewLogbookEntry(
      reviewingLog.id,
      rating,
      feedback || 'Please provide more details on safety isolation steps and specific measurements recorded.',
      false
    );
    setReviewingLog(null);
  };

  return (
    <div className="space-y-8">
      {/* Mentor Profile & Host Company Header */}
      <div className="p-6 rounded-2xl border border-border bg-card shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 rounded-xl overflow-hidden border border-border bg-muted shrink-0">
            <Image
              src="https://picsum.photos/seed/skilltrack-mentor/400/400"
              alt="Martin Ouma"
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Workplace Mentor Console</span>
              <span aria-hidden="true">·</span>
              <span>Apex Mechatronics Ltd</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Eng. Martin Ouma
            </h1>
            <p className="text-xs text-muted-foreground">
              Senior Automation Engineer & Appointed TVET Industrial Supervisor
            </p>
          </div>
        </div>

        {/* Quick Review Status Counter */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center min-w-[100px]">
            <div className="text-xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
              {pendingLogs.length}
            </div>
            <div className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
              Pending Sign-off
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center min-w-[100px]">
            <div className="text-xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {approvedLogs.length}
            </div>
            <div className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
              Signed & Verified
            </div>
          </div>
        </div>
      </div>

      {/* Main Mentor Operational Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Pending Review Queue & Log History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Sign-Off Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  Workplace Logbooks Awaiting Mentor Signature
                </h2>
                <p className="text-xs text-muted-foreground">
                  Verify technical competence, on-site hours, and safety protocol adherence.
                </p>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                {pendingLogs.length} pending
              </span>
            </div>

            {pendingLogs.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-border rounded-xl bg-muted/10 space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-semibold text-foreground">Review Queue Clear</h4>
                <p className="text-xs text-muted-foreground">
                  All submitted attachee daily entries have been signed and approved.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingLogs.map((entry) => (
                  <Card key={entry.id} className="border-amber-500/30 bg-amber-500/5">
                    <CardHeader className="pb-2">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">
                              {mentorAttachment.traineeName}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>Week {entry.weekNumber}</span>
                            <span aria-hidden="true">·</span>
                            <span>{entry.date}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums font-semibold text-foreground">
                              {entry.hours} hrs
                            </span>
                          </div>
                          <CardTitle className="text-base text-foreground font-semibold">
                            {entry.title}
                          </CardTitle>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => openReviewModal(entry)}
                          className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
                        >
                          <FileCheck className="h-3.5 w-3.5 mr-1" />
                          Review & Sign-Off
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 pt-0">
                      <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                        {entry.description}
                      </p>

                      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-4">
                        <div>
                          <span className="font-medium text-foreground">Tools: </span>
                          <span>{entry.toolsEquipment}</span>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-600">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>LOTO & PPE Confirmed</span>
                        </div>
                      </div>

                      {entry.competencyTags && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {entry.competencyTags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] bg-background border border-border px-1.5 py-0.5 rounded text-foreground/80"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Approved Entries History */}
          <div className="space-y-3 pt-4 border-t border-border">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Recently Signed Logbooks
            </h2>

            <div className="space-y-2">
              {approvedLogs.slice(0, 5).map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>{entry.date}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{entry.hours} hrs</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-600 font-medium">Signed</span>
                    </div>
                    <div className="font-semibold text-foreground text-sm">{entry.title}</div>
                    {entry.mentorFeedback && (
                      <p className="text-muted-foreground italic text-[11px] truncate max-w-lg">
                        &quot;{entry.mentorFeedback}&quot;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-amber-500 font-mono text-xs shrink-0">
                    <Star className="h-3 w-3 fill-amber-500" />
                    <span>{entry.mentorRating}/5</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Attachee Supervision Card */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Attachee</CardTitle>
              <CardDescription>
                Direct workplace supervision under Apex Mechatronics agreement.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border">
                <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-border bg-background shrink-0">
                  <Image
                    src={mentorAttachment.traineeAvatar || 'https://picsum.photos/seed/skilltrack-trainee/400/400'}
                    alt={mentorAttachment.traineeName}
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="font-bold text-sm text-foreground truncate">
                    {mentorAttachment.traineeName}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {mentorAttachment.traineeRegNumber}
                  </div>
                  <div className="text-[11px] text-primary font-medium truncate">
                    Nairobi Technical Polytechnic
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Trade Qualification:</span>
                  <span className="font-semibold text-foreground">TVET Level 6 Diploma</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Curriculum:</span>
                  <span className="font-semibold text-foreground">Electrical Automation</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Hours Completed:</span>
                  <span className="font-mono tabular-nums font-semibold text-foreground">
                    {mentorAttachment.loggedHours} / {mentorAttachment.requiredHours} hrs
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Attachment Weeks:</span>
                  <span className="font-mono tabular-nums font-semibold text-foreground">
                    Week {mentorAttachment.completedWeeks} of {mentorAttachment.totalWeeks}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Overall Competency:</span>
                  <span className="font-mono tabular-nums font-semibold text-emerald-600">
                    {mentorAttachment.competencyScore}%
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1 text-xs text-muted-foreground">
                <div className="font-semibold text-primary flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5" />
                  <span>Workplace Competency Rubric</span>
                </div>
                <p>
                  As certified mentor, your evaluations contribute 40% towards the trainee&apos;s statutory TVET graduation portfolio.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Review Modal Dialog */}
      {reviewingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-foreground">Evaluate & Sign Attachee Logbook</h3>
                <p className="text-xs text-muted-foreground">
                  {mentorAttachment.traineeName} · {reviewingLog.date} ({reviewingLog.hours} hrs)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewingLog(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            {/* Entry Summary */}
            <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-2 text-xs">
              <div className="font-semibold text-foreground text-sm">{reviewingLog.title}</div>
              <p className="text-foreground/90 leading-relaxed">{reviewingLog.description}</p>
              <div className="text-muted-foreground">
                <span className="font-medium text-foreground">Tools Used: </span>
                <span>{reviewingLog.toolsEquipment}</span>
              </div>
            </div>

            {/* TVET Competency Rating (1 to 5 Rubric) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>TVET Competency Scale Assessment</span>
                <span className="font-mono text-amber-500 font-bold">
                  {rating === 1 && 'Level 1: Novice / Needs Guidance'}
                  {rating === 2 && 'Level 2: Advanced Beginner'}
                  {rating === 3 && 'Level 3: Competent (Supervised)'}
                  {rating === 4 && 'Level 4: Proficient (Autonomous)'}
                  {rating === 5 && 'Level 5: Master / Commendable'}
                </span>
              </label>

              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setRating(lvl as CompetencyRating)}
                    className={`py-2 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-colors ${
                      rating === lvl
                        ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                        : 'border-border bg-background text-foreground hover:bg-muted'
                    }`}
                  >
                    <Star
                      className={`h-3.5 w-3.5 ${
                        rating >= lvl ? 'fill-current text-current' : 'text-muted-foreground'
                      }`}
                    />
                    <span>Scale {lvl}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mentor Feedback & Qualitative Notes */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Workplace Supervisor Comments & Constructive Feedback
              </label>
              <textarea
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Write specific feedback on procedural accuracy, safety compliance, or technical areas to improve..."
                className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary leading-relaxed"
                required
              />
            </div>

            {/* Mandatory Verification Check */}
            <div className="p-3 rounded-lg border border-border bg-muted/20 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={safetyVerified}
                  onChange={(e) => setSafetyVerified(e.target.checked)}
                  className="rounded border-border text-primary"
                />
                <span>
                  I confirm the trainee performed this work under industrial supervision and met mandatory OSHA safety standards.
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRequestRevision}
              >
                Request Revision
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReviewingLog(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApprove}
                  disabled={!safetyVerified}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Digitally Sign & Approve
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
