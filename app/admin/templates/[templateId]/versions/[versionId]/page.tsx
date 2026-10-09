import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader, TemplateStatusBadge } from '@/components/admin/page-parts';
import { getTemplateVersion } from '@/modules/templates/service';
import { listCurriculumUnitOptions } from '@/modules/curriculum/service';
import {
  CloneForm,
  MarkReadyForm,
  PublishForm,
  TransitionForm,
  ValidateForm,
} from '../../../lifecycle-forms';
import { VersionEditor, type EditorSection } from './editor';

const SEVERITY_STYLES: Record<string, string> = {
  ERROR: 'border-destructive/30 bg-destructive/10 text-destructive',
  WARNING: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  INFO: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400',
};

export default async function TemplateVersionPage({
  params,
}: {
  params: Promise<{ templateId: string; versionId: string }>;
}) {
  const { templateId, versionId } = await params;
  const version = await getTemplateVersion(versionId);
  if (!version || version.template.id !== templateId) notFound();

  const units = await listCurriculumUnitOptions(version.template.programmeId);
  const editable = version.status === 'DRAFT' || version.status === 'IN_REVIEW';

  const sections: EditorSection[] = version.sections.map((section) => ({
    id: section.id,
    parentSectionId: section.parentSectionId,
    sectionNumber: section.sectionNumber,
    title: section.title,
    description: section.description,
    sectionType: section.sectionType,
    mappingStatus: section.mappingStatus,
    evaluationItems: section.evaluationItems.map((item) => ({
      id: item.id,
      itemNumber: item.itemNumber,
      description: item.description,
      sourceWording: item.sourceWording,
      category: item.category,
      notes: item.notes,
    })),
    competencyRules: section.competencyRules.map((rule) => ({
      id: rule.id,
      ruleType: rule.ruleType,
      minimumCorrect: rule.minimumCorrect,
      minimumPercentage: rule.minimumPercentage,
      requiredItemNumbers: rule.requiredItemNumbers,
      sourceWording: rule.sourceWording,
      notes: rule.notes,
    })),
    curriculumUnitLinks: section.curriculumUnitLinks.map((link) => ({
      curriculumUnitId: link.curriculumUnitId,
    })),
  }));

  const versionLevelRules = version.competencyRules.map((rule) => ({
    id: rule.id,
    ruleType: rule.ruleType,
    minimumCorrect: rule.minimumCorrect,
    minimumPercentage: rule.minimumPercentage,
    requiredItemNumbers: rule.requiredItemNumbers,
    sourceWording: rule.sourceWording,
    notes: rule.notes,
  }));

  const latestRun = version.validationRuns[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${version.title ?? version.template.title} — v${version.versionNumber}`}
        description={`${version.template.programme.code} — ${version.template.programme.name}`}
        action={
          <Button variant="outline" render={<Link href={`/admin/templates/${templateId}`} />}>
            Back to template
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-base">Version status</CardTitle>
            <CardDescription>
              {version.sourceDocument
                ? `Extracted from ${version.sourceDocument.fileName}`
                : version.basedOnVersion
                  ? `Cloned from v${version.basedOnVersion.versionNumber}`
                  : 'Manually authored'}
              {version.validatedAt
                ? ` · validated ${version.validatedAt.toLocaleString()}`
                : ''}
              {version.publishedAt ? ` · published ${version.publishedAt.toLocaleString()}` : ''}
            </CardDescription>
          </div>
          <TemplateStatusBadge status={version.status} />
        </CardHeader>
        <CardContent className="space-y-4">
          {!editable ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
              This version is {version.status.toLowerCase().replace(/_/g, ' ')} and read-only. Make
              changes by cloning it into a new draft.
            </div>
          ) : null}

          <div className="flex flex-wrap items-start gap-3">
            {version.status === 'DRAFT' ? (
              <TransitionForm
                templateId={templateId}
                versionId={version.id}
                to="IN_REVIEW"
                label="Submit for review"
              />
            ) : null}
            {version.status === 'IN_REVIEW' ? (
              <TransitionForm
                templateId={templateId}
                versionId={version.id}
                to="DRAFT"
                label="Return to draft"
              />
            ) : null}
            {version.status === 'READY_FOR_PUBLISH' ? (
              <>
                <TransitionForm
                  templateId={templateId}
                  versionId={version.id}
                  to="DRAFT"
                  label="Return to draft"
                />
                <PublishForm templateId={templateId} versionId={version.id} />
              </>
            ) : null}
            {version.status === 'PUBLISHED' ? (
              <>
                <TransitionForm
                  templateId={templateId}
                  versionId={version.id}
                  to="ARCHIVED"
                  label="Archive"
                />
                <CloneForm
                  templateId={templateId}
                  sourceVersionId={version.id}
                  label="New draft from this version"
                />
              </>
            ) : null}
            {version.status === 'ARCHIVED' ? (
              <CloneForm
                templateId={templateId}
                sourceVersionId={version.id}
                label="New draft from this version"
              />
            ) : null}
            {editable ? <MarkReadyForm templateId={templateId} versionId={version.id} /> : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Latest validation</CardTitle>
            <CardDescription>
              {latestRun
                ? `Ruleset ${latestRun.rulesetVersion} · revision ${latestRun.revision} · ${latestRun.createdAt.toLocaleString()}`
                : 'No validation run recorded yet.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {latestRun ? (
              <>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      latestRun.status === 'PASSED'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        : 'border-destructive/30 bg-destructive/10 text-destructive'
                    }
                  >
                    {latestRun.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {latestRun.errorCount} errors · {latestRun.warningCount} warnings
                  </span>
                </div>
                {latestRun.issues.slice(0, 12).map((issue) => (
                  <div key={issue.id} className="flex items-start gap-2 text-sm">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${SEVERITY_STYLES[issue.severity] ?? ''}`}
                    >
                      {issue.severity}
                    </Badge>
                    <span className="text-foreground">{issue.message}</span>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Run validation to record the first immutable result.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Run validation</CardTitle>
            <CardDescription>
              Validation does not change the status. Marking ready requires a clean result.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ValidateForm templateId={templateId} versionId={version.id} />
          </CardContent>
        </Card>
      </div>

      {version.warnings.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Extraction warnings</CardTitle>
            <CardDescription>Flagged during extraction or semantic checks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {version.warnings.map((warning) => (
              <div key={warning.id} className="flex items-start gap-3 rounded-lg border border-border/70 px-3 py-2">
                <Badge
                  variant="outline"
                  className={`text-[10px] ${SEVERITY_STYLES[warning.severity ?? 'WARNING'] ?? ''}`}
                >
                  {warning.severity ?? 'WARNING'}
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

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Structure</h2>
        <VersionEditor
          templateId={templateId}
          versionId={version.id}
          sections={sections}
          versionLevelRules={versionLevelRules}
          units={units}
          editable={editable}
        />
      </div>
    </div>
  );
}
