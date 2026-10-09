import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState, PageHeader, TemplateStatusBadge } from '@/components/admin/page-parts';
import { getSourceDocument } from '@/modules/documents/service';
import {
  getLatestDraftForDocument,
  getTemplateVersion,
} from '@/modules/templates/service';
import { listCurriculumUnitOptions } from '@/modules/curriculum/service';
import { ItemForm, MappingForm, RuleForm, SectionForm, ValidateForm } from './review-forms';

const SEVERITY_STYLES: Record<string, string> = {
  INFO: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400',
  WARNING: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  ERROR: 'border-destructive/30 bg-destructive/10 text-destructive',
};

export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ version?: string }>;
}) {
  const { id } = await params;
  const { version: versionParam } = await searchParams;

  const document = await getSourceDocument(id);
  if (!document) notFound();

  const fallback = versionParam ? null : await getLatestDraftForDocument(id);
  const versionId = versionParam ?? fallback?.id;
  if (!versionId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Review extraction"
          action={
            <Button variant="outline" render={<Link href={`/admin/documents/${id}`} />}>
              Back to document
            </Button>
          }
        />
        <EmptyState
          title="No template version to review"
          description="Run extraction on this document first to create a draft version."
        />
      </div>
    );
  }

  const version = await getTemplateVersion(versionId);
  if (!version || version.sourceDocumentId !== id) notFound();

  const units = await listCurriculumUnitOptions(document.programmeId);
  const editable = version.status === 'EXTRACTION_DRAFT';
  const versionLevelRules = version.competencyRules;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${version.title ?? version.template.title} — review`}
        description={`Version ${version.versionNumber} · extracted from ${document.fileName}`}
        action={
          <Button variant="outline" render={<Link href={`/admin/documents/${id}`} />}>
            Back to document
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-base">Extraction summary</CardTitle>
            <CardDescription>
              {version.extractionRun
                ? `${version.extractionRun.model} · prompt ${version.extractionRun.promptVersion} · ${version.extractionRun.createdAt.toLocaleString()}`
                : 'Manually created version.'}
            </CardDescription>
          </div>
          <TemplateStatusBadge status={version.status} />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{version.sections.length}</span> sections
            </span>
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{version.warnings.length}</span> warnings
            </span>
            {version.validatedAt ? (
              <span className="text-muted-foreground">
                Validated {version.validatedAt.toLocaleString()}
                {version.validatedBy ? ` by ${version.validatedBy.name}` : ''}
              </span>
            ) : null}
          </div>
          {!editable ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
              This version is {version.status.toLowerCase()} and read-only. Later changes require a new
              extraction or a copied draft.
            </div>
          ) : null}
        </CardContent>
      </Card>

      {version.warnings.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Extraction warnings</CardTitle>
            <CardDescription>
              Flagged by the extraction or semantic checks. Resolve or acknowledge during review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {version.warnings.map((warning) => (
              <div
                key={warning.id}
                className="flex items-start gap-3 rounded-lg border border-border/70 px-3 py-2"
              >
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

      {version.sections.map((section) => {
        const selectedUnitIds = section.curriculumUnitLinks.map((link) => link.curriculumUnitId);
        return (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {section.sectionNumber ? (
                  <span className="font-mono text-xs text-muted-foreground">
                    {section.sectionNumber}
                  </span>
                ) : null}
                {section.title}
              </CardTitle>
              <CardDescription>
                {section.evaluationItems.length} evaluation items · {section.competencyRules.length}{' '}
                rules · mapping {section.mappingStatus.toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SectionForm documentId={id} section={section} disabled={!editable} />

              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Evaluation items
                </h3>
                {section.evaluationItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No items extracted for this section.</p>
                ) : (
                  section.evaluationItems.map((item) => (
                    <ItemForm key={item.id} documentId={id} item={item} disabled={!editable} />
                  ))
                )}
              </div>

              {section.competencyRules.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Competency rules
                  </h3>
                  {section.competencyRules.map((rule) => (
                    <RuleForm key={rule.id} documentId={id} rule={rule} disabled={!editable} />
                  ))}
                </div>
              ) : null}

              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Curriculum mapping
                </h3>
                <MappingForm
                  documentId={id}
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
      })}

      {versionLevelRules.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Version-level competency rules</CardTitle>
            <CardDescription>Rules that apply to the whole template, not a single section.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {versionLevelRules.map((rule) => (
              <RuleForm key={rule.id} documentId={id} rule={rule} disabled={!editable} />
            ))}
          </CardContent>
        </Card>
      ) : null}

      {editable ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Validate this version</CardTitle>
            <CardDescription>
              Validation freezes this version as the reviewed definition for publishing in a later
              sprint. It does not publish automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ValidateForm documentId={id} versionId={version.id} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
