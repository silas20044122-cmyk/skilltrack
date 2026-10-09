import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, PageHeader, TemplateStatusBadge } from '@/components/admin/page-parts';
import { getTemplateDetail } from '@/modules/templates/service';
import {
  CloneForm,
  MarkReadyForm,
  PublishForm,
  TransitionForm,
  ValidateForm,
} from '../lifecycle-forms';

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  const template = await getTemplateDetail(templateId);
  if (!template) notFound();

  const currentPublished = template.versions.find((v) => v.status === 'PUBLISHED');

  return (
    <div className="space-y-6">
      <PageHeader
        title={template.title}
        description={`${template.programme.code} — ${template.programme.name}`}
        action={
          <Button
            variant="outline"
            render={<Link href={`/admin/programmes/${template.programme.id}/documents`} />}
          >
            Back to programme documents
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-base">Template</CardTitle>
            <CardDescription>
              {template.description ?? 'No description.'}
              {template.sourceDocument
                ? ` · Source: ${template.sourceDocument.fileName}`
                : ' · Manually created'}
            </CardDescription>
          </div>
          {currentPublished ? (
            <TemplateStatusBadge status="PUBLISHED" />
          ) : (
            <span className="text-xs text-muted-foreground">Not published</span>
          )}
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {currentPublished ? (
            <span>
              Current published: v{currentPublished.versionNumber}
              {currentPublished.publishedAt
                ? ` on ${currentPublished.publishedAt.toLocaleString()}`
                : ''}
            </span>
          ) : (
            <span>No version of this template has been published yet.</span>
          )}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Versions</h2>
        <DataTable
          head={
            <tr>
              <th className="px-4 py-2.5 font-semibold">Version</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 font-semibold">Sections</th>
              <th className="px-4 py-2.5 font-semibold">Provenance</th>
              <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
            </tr>
          }
        >
          {template.versions.map((version) => {
            const editable = version.status === 'DRAFT' || version.status === 'IN_REVIEW';
            return (
              <tr key={version.id} className="hover:bg-muted/20">
                <td className="px-4 py-3 font-medium text-foreground">v{version.versionNumber}</td>
                <td className="px-4 py-3">
                  <TemplateStatusBadge status={version.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {version._count.sections} · {version._count.validationRuns} validation runs
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {version.basedOnVersion
                    ? `Cloned from v${version.basedOnVersion.versionNumber}`
                    : version.sourceDocument
                      ? `Extracted from ${version.sourceDocument.fileName}`
                      : 'Manually authored'}
                  {version.validatedAt
                    ? ` · validated ${version.validatedAt.toLocaleDateString()}`
                    : ''}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-start justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2.5 text-xs"
                      render={
                        <Link href={`/admin/templates/${template.id}/versions/${version.id}`} />
                      }
                    >
                      Open
                    </Button>
                    {version.status === 'DRAFT' ? (
                      <TransitionForm
                        templateId={template.id}
                        versionId={version.id}
                        to="IN_REVIEW"
                        label="Submit for review"
                      />
                    ) : null}
                    {version.status === 'IN_REVIEW' ? (
                      <TransitionForm
                        templateId={template.id}
                        versionId={version.id}
                        to="DRAFT"
                        label="Return to draft"
                      />
                    ) : null}
                    {editable ? (
                      <MarkReadyForm templateId={template.id} versionId={version.id} />
                    ) : null}
                    {version.status === 'READY_FOR_PUBLISH' ? (
                      <>
                        <TransitionForm
                          templateId={template.id}
                          versionId={version.id}
                          to="DRAFT"
                          label="Return to draft"
                        />
                        <PublishForm templateId={template.id} versionId={version.id} />
                      </>
                    ) : null}
                    {version.status === 'PUBLISHED' ? (
                      <TransitionForm
                        templateId={template.id}
                        versionId={version.id}
                        to="ARCHIVED"
                        label="Archive"
                      />
                    ) : null}
                    {version.status === 'PUBLISHED' || version.status === 'ARCHIVED' ? (
                      <CloneForm templateId={template.id} sourceVersionId={version.id} label="Clone to draft" />
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </DataTable>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Validation</CardTitle>
          <CardDescription>
            Validation runs are recorded immutably. Publishing always re-validates immediately before
            the version becomes live.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {template.versions.filter((v) => v.status === 'DRAFT' || v.status === 'IN_REVIEW').length ===
          0 ? (
            <p className="text-sm text-muted-foreground">
              No editable draft is available. Clone a published or archived version to make changes.
            </p>
          ) : (
            template.versions
              .filter((v) => v.status === 'DRAFT' || v.status === 'IN_REVIEW')
              .map((version) => (
                <div key={version.id} className="rounded-lg border border-border/70 p-3">
                  <p className="mb-2 text-xs font-semibold text-foreground">
                    v{version.versionNumber} — run validation without changing status
                  </p>
                  <ValidateForm templateId={template.id} versionId={version.id} />
                </div>
              ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
