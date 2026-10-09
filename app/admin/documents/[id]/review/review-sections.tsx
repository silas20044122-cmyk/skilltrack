'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { TemplateStatusBadge } from '@/components/admin/page-parts';
import { cn } from '@/lib/utils';
import { ItemForm, MappingForm, RuleForm, SectionForm, ValidateForm } from './review-forms';

export interface ReviewItem {
  id: string;
  itemNumber: string | null;
  description: string;
  sourceWording: string | null;
  category: string;
  notes: string | null;
}

export interface ReviewRule {
  id: string;
  ruleType: string;
  minimumCorrect: number | null;
  minimumPercentage: number | null;
  requiredItemNumbers: unknown;
  sourceWording: string;
  notes: string | null;
}

export interface ReviewSection {
  id: string;
  sectionNumber: string | null;
  title: string;
  description: string | null;
  sectionType: string | null;
  mappingStatus: string;
  evaluationItems: ReviewItem[];
  competencyRules: ReviewRule[];
  curriculumUnitLinks: { curriculumUnitId: string }[];
}

export interface ReviewUnit {
  id: string;
  code: string;
  name: string;
}

export interface ReviewWarning {
  id: string;
  severity: string;
  message: string;
  type: string;
  sourceReference: string | null;
}

export interface ReviewSummary {
  status: string;
  extractionModel: string | null;
  promptVersion: string | null;
  extractedAt: string | null;
  sectionCount: number;
  warningCount: number;
  validatedAt: string | null;
  validatedByName: string | null;
  editable: boolean;
}

const SEVERITY_STYLES: Record<string, string> = {
  INFO: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400',
  WARNING: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  ERROR: 'border-destructive/30 bg-destructive/10 text-destructive',
};

const OVERVIEW_STEP = 'overview';
const VERSION_STEP = 'version';

type Step =
  | { id: typeof OVERVIEW_STEP; kind: 'overview'; title: string; subtitle: string }
  | { id: string; kind: 'section'; title: string; subtitle: string; section: ReviewSection }
  | { id: typeof VERSION_STEP; kind: 'version'; title: string; subtitle: string };

function SectionPanel({
  documentId,
  section,
  units,
  editable,
}: {
  documentId: string;
  section: ReviewSection;
  units: ReviewUnit[];
  editable: boolean;
}) {
  const selectedUnitIds = section.curriculumUnitLinks.map((link) => link.curriculumUnitId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {section.sectionNumber ? (
            <span className="font-mono text-xs text-muted-foreground">{section.sectionNumber}</span>
          ) : null}
          {section.title}
        </CardTitle>
        <CardDescription>
          {section.evaluationItems.length} evaluation items · {section.competencyRules.length} rules ·
          mapping {section.mappingStatus.toLowerCase()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SectionForm documentId={documentId} section={section} disabled={!editable} />

        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Evaluation items
          </h3>
          {section.evaluationItems.length === 0 ? (
            <p className="text-xs text-muted-foreground">No items extracted for this section.</p>
          ) : (
            section.evaluationItems.map((item) => (
              <ItemForm key={item.id} documentId={documentId} item={item} disabled={!editable} />
            ))
          )}
        </div>

        {section.competencyRules.length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Competency rules
            </h3>
            {section.competencyRules.map((rule) => (
              <RuleForm key={rule.id} documentId={documentId} rule={rule} disabled={!editable} />
            ))}
          </div>
        ) : null}

        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Curriculum mapping
          </h3>
          <MappingForm
            documentId={documentId}
            sectionId={section.id}
            mappingStatus={section.mappingStatus}
            units={units}
            selectedUnitIds={selectedUnitIds}
            disabled={!editable}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function VersionRulesPanel({
  documentId,
  rules,
  editable,
}: {
  documentId: string;
  rules: ReviewRule[];
  editable: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Version-level competency rules</CardTitle>
        <CardDescription>Rules that apply to the whole template, not a single section.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {rules.map((rule) => (
          <RuleForm key={rule.id} documentId={documentId} rule={rule} disabled={!editable} />
        ))}
      </CardContent>
    </Card>
  );
}

function OverviewPanel({
  documentId,
  versionId,
  summary,
  warnings,
}: {
  documentId: string;
  versionId: string;
  summary: ReviewSummary;
  warnings: ReviewWarning[];
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-base">Extraction summary</CardTitle>
            <CardDescription>
              {summary.extractionModel
                ? `${summary.extractionModel} · prompt ${summary.promptVersion} · ${summary.extractedAt}`
                : 'Manually created version.'}
            </CardDescription>
          </div>
          <TemplateStatusBadge status={summary.status} />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{summary.sectionCount}</span> sections
            </span>
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{summary.warningCount}</span> warnings
            </span>
            {summary.validatedAt ? (
              <span className="text-muted-foreground">
                Validated {summary.validatedAt}
                {summary.validatedByName ? ` by ${summary.validatedByName}` : ''}
              </span>
            ) : null}
          </div>
          {!summary.editable ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
              This version is {summary.status.toLowerCase()} and read-only. Later changes require a new
              extraction or a copied draft.
            </div>
          ) : null}
        </CardContent>
      </Card>

      {warnings.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Extraction warnings</CardTitle>
            <CardDescription>
              Flagged by the extraction or semantic checks. Resolve or acknowledge during review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {warnings.map((warning) => (
              <div
                key={warning.id}
                className="flex items-start gap-3 rounded-lg border border-border/70 px-3 py-2"
              >
                <Badge
                  variant="outline"
                  className={cn('text-[10px]', SEVERITY_STYLES[warning.severity] ?? '')}
                >
                  {warning.severity}
                </Badge>
                <div className="space-y-0.5">
                  <p className="text-sm text-foreground">{warning.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {warning.type}
                    {warning.sourceReference ? ` · ${warning.sourceReference}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {summary.editable ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Validate this version</CardTitle>
            <CardDescription>
              Validation freezes this version as the reviewed definition for publishing. It does not
              publish automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ValidateForm documentId={documentId} versionId={versionId} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export function ReviewSections({
  documentId,
  versionId,
  sections,
  versionLevelRules,
  units,
  warnings,
  summary,
}: {
  documentId: string;
  versionId: string;
  sections: ReviewSection[];
  versionLevelRules: ReviewRule[];
  units: ReviewUnit[];
  warnings: ReviewWarning[];
  summary: ReviewSummary;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const steps = React.useMemo<Step[]>(() => {
    const list: Step[] = [
      {
        id: OVERVIEW_STEP,
        kind: 'overview',
        title: 'Overview',
        subtitle: 'Extraction summary, warnings & validation',
      },
    ];
    for (const section of sections) {
      list.push({
        id: section.id,
        kind: 'section',
        title: section.title,
        subtitle: section.sectionNumber ?? 'Section',
        section,
      });
    }
    if (versionLevelRules.length > 0) {
      list.push({
        id: VERSION_STEP,
        kind: 'version',
        title: 'Version-level rules',
        subtitle: 'Template-wide competency rules',
      });
    }
    return list;
  }, [sections, versionLevelRules.length]);

  const defaultId = sections[0]?.id ?? OVERVIEW_STEP;
  const requested = searchParams.get('tab');
  const activeId = requested && steps.some((step) => step.id === requested) ? requested : defaultId;
  const activeIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === activeId)
  );
  const step = steps[activeIndex] ?? steps[0];

  const panelRef = React.useRef<HTMLDivElement>(null);
  const baselineRef = React.useRef('');

  const snapshot = React.useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return '';
    const parts: string[] = [];
    panel
      .querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        'input[name], textarea[name], select[name]'
      )
      .forEach((element) => {
        if (element instanceof HTMLInputElement && (element.type === 'checkbox' || element.type === 'radio')) {
          parts.push(`${element.name}=${element.checked ? '1' : '0'}`);
        } else if (element instanceof HTMLInputElement && element.type === 'file') {
          parts.push(`${element.name}=${element.files?.length ?? 0}`);
        } else {
          parts.push(`${element.name}=${element.value}`);
        }
      });
    return parts.join('\u0001');
  }, []);

  // Reset the baseline whenever the server hands us fresh data for the active
  // step (e.g. after a successful save); user edits don't change this signature.
  const dataSignature = React.useMemo(
    () => `${step?.kind ?? 'overview'}:${activeIndex}:${summary.status}:${summary.warningCount}`,
    [step?.kind, activeIndex, summary.status, summary.warningCount]
  );

  React.useEffect(() => {
    baselineRef.current = snapshot();
  }, [dataSignature, snapshot]);

  React.useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (snapshot() !== baselineRef.current) {
        event.preventDefault();
        event.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [snapshot]);

  const [pendingStep, setPendingStep] = React.useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const go = React.useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', id);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  function requestStep(id: string) {
    if (id === activeId) return;
    if (snapshot() !== baselineRef.current) {
      setPendingStep(id);
      setConfirmOpen(true);
      return;
    }
    go(id);
  }

  function discardAndGo() {
    const id = pendingStep;
    setConfirmOpen(false);
    setPendingStep(null);
    if (id) go(id);
  }

  const previous = activeIndex > 0 ? steps[activeIndex - 1] : null;
  const next = activeIndex < steps.length - 1 ? steps[activeIndex + 1] : null;

  const navButtonClass =
    'inline-flex h-9 items-center rounded-lg border border-border bg-background px-4 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {step.subtitle}
          </p>
          <h2 className="truncate text-base font-semibold text-foreground">{step.title}</h2>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          Step {activeIndex + 1} of {steps.length}
        </span>
      </div>

      <div ref={panelRef} role="tabpanel">
        {step.kind === 'overview' ? (
          <OverviewPanel documentId={documentId} versionId={versionId} summary={summary} warnings={warnings} />
        ) : step.kind === 'version' ? (
          <VersionRulesPanel documentId={documentId} rules={versionLevelRules} editable={summary.editable} />
        ) : (
          <SectionPanel documentId={documentId} section={step.section} units={units} editable={summary.editable} />
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <button
          type="button"
          className={navButtonClass}
          disabled={!previous}
          onClick={() => previous && requestStep(previous.id)}
        >
          ← Previous
        </button>
        <span className="text-xs text-muted-foreground">
          {activeIndex + 1} / {steps.length}
        </span>
        <button
          type="button"
          className={navButtonClass}
          disabled={!next}
          onClick={() => next && requestStep(next.id)}
        >
          Next →
        </button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogTitle className="text-base font-semibold">Discard unsaved changes?</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            This section has unsaved edits. Moving on will discard them.
          </DialogDescription>
          <div className="mt-4 flex justify-end gap-2">
            <DialogClose className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted">
              Stay
            </DialogClose>
            <button
              type="button"
              onClick={discardAndGo}
              className="inline-flex h-8 items-center rounded-lg border border-destructive/30 bg-destructive/10 px-3 text-sm font-medium text-destructive hover:bg-destructive/20"
            >
              Discard &amp; continue
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
