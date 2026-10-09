import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { EmptyState, PageHeader } from '@/components/admin/page-parts';
import { getSourceDocument } from '@/modules/documents/service';
import {
  getLatestDraftForDocument,
  getTemplateVersion,
} from '@/modules/templates/service';
import { listCurriculumUnitOptions } from '@/modules/curriculum/service';
import { ReviewSections } from './review-sections';

export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ version?: string; tab?: string }>;
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
  const editable = version.status === 'DRAFT' || version.status === 'IN_REVIEW';

  const sections = version.sections.map((section) => ({
    id: section.id,
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

  const warnings = version.warnings.map((warning) => ({
    id: warning.id,
    severity: warning.severity ?? 'WARNING',
    message: warning.message,
    type: warning.type,
    sourceReference: warning.sourceReference,
  }));

  const summary = {
    status: version.status,
    extractionModel: version.extractionRun?.model ?? null,
    promptVersion: version.extractionRun?.promptVersion ?? null,
    extractedAt: version.extractionRun ? version.extractionRun.createdAt.toLocaleString() : null,
    sectionCount: version.sections.length,
    warningCount: version.warnings.length,
    validatedAt: version.validatedAt ? version.validatedAt.toLocaleString() : null,
    validatedByName: version.validatedBy?.name ?? null,
    editable,
  };

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

      <ReviewSections
        documentId={id}
        versionId={version.id}
        sections={sections}
        versionLevelRules={versionLevelRules}
        units={units}
        warnings={warnings}
        summary={summary}
      />
    </div>
  );
}
