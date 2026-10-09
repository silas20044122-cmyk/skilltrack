import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DataTable,
  DocumentStatusBadge,
  PageHeader,
  TemplateStatusBadge,
} from '@/components/admin/page-parts';
import { ConfirmSubmit } from '@/components/admin/confirm-submit';
import { getSourceDocument } from '@/modules/documents/service';
import { ExtractionButton } from '../extraction-button';
import { deleteSourceDocumentAction } from '../actions';

export const maxDuration = 300;


function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const document = await getSourceDocument(id);
  if (!document) notFound();

  const hasLockedVersion = document.templateVersions.some(
    (v) => v.status === 'READY_FOR_PUBLISH' || v.status === 'PUBLISHED'
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={document.fileName}
        description={`${document.programme.name} — uploaded ${document.createdAt.toLocaleString()}`}
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              render={<Link href={`/admin/programmes/${document.programmeId}/documents`} />}
            >
              Back to documents
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-base">Document</CardTitle>
            <CardDescription>
              Stored privately in object storage; downloads require authorization.
            </CardDescription>
          </div>
          <DocumentStatusBadge status={document.status} />
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">File size</dt>
              <dd className="font-medium text-foreground">{formatSize(document.fileSize)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Uploaded by</dt>
              <dd className="font-medium text-foreground">
                {document.uploadedBy?.name ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">SHA-256</dt>
              <dd className="truncate font-mono text-xs text-foreground" title={document.fileHash ?? ''}>
                {document.fileHash ? `${document.fileHash.slice(0, 16)}…` : '—'}
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              render={
                <a href={`/api/admin/documents/${document.id}/file`} target="_blank" rel="noreferrer" />
              }
            >
              Download PDF
            </Button>
            <ExtractionButton
              documentId={document.id}
              status={document.status}
              label={document.extractionRuns.length > 0 ? 'Run extraction again' : 'Run extraction'}
            />
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Extraction runs</h2>
        {document.extractionRuns.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No extraction has been run yet. Running extraction sends the PDF to Gemini and stores the
            result as a new draft template version.
          </p>
        ) : (
          <DataTable
            head={
              <tr>
                <th className="px-4 py-2.5 font-semibold">Started</th>
                <th className="px-4 py-2.5 font-semibold">Model</th>
                <th className="px-4 py-2.5 font-semibold">Prompt</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold">Detail</th>
              </tr>
            }
          >
            {document.extractionRuns.map((run) => (
              <tr key={run.id} className="hover:bg-muted/20">
                <td className="px-4 py-3 text-muted-foreground">
                  {run.createdAt.toLocaleString()}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{run.model}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {run.promptVersion}
                </td>
                <td className="px-4 py-3">
                  <DocumentStatusBadge status={run.status} />
                </td>
                <td className="max-w-[320px] px-4 py-3 text-xs text-muted-foreground">
                  {run.errorMessage ? (
                    <span className="text-destructive">{run.errorMessage}</span>
                  ) : run.status === 'COMPLETED' ? (
                    'Structured output stored'
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Template versions</h2>
        {document.templateVersions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No template versions yet. Run extraction to create a draft.
          </p>
        ) : (
          <DataTable
            head={
              <tr>
                <th className="px-4 py-2.5 font-semibold">Version</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
              </tr>
            }
          >
            {document.templateVersions.map((version) => (
              <tr key={version.id} className="hover:bg-muted/20">
                <td className="px-4 py-3 font-medium text-foreground">
                  {version.template.title} — v{version.versionNumber}
                </td>
                <td className="px-4 py-3">
                  <TemplateStatusBadge status={version.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    render={
                      <Link href={`/admin/documents/${document.id}/review?version=${version.id}`} />
                    }
                  >
                    {version.status === 'DRAFT' || version.status === 'IN_REVIEW'
                      ? 'Review'
                      : 'Open'}
                  </Button>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </section>

      {!hasLockedVersion ? (
        <div className="flex justify-end">
          <ConfirmSubmit
            action={deleteSourceDocumentAction}
            fields={{ documentId: document.id, programmeId: document.programmeId }}
            triggerLabel="Delete document"
            title="Delete this document?"
            description="The PDF and its draft extraction data will be removed. This cannot be undone."
            confirmLabel="Delete document"
            variant="destructive"
          />
        </div>
      ) : null}
    </div>
  );
}
