import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DataTable,
  DocumentStatusBadge,
  EmptyState,
  PageHeader,
} from '@/components/admin/page-parts';
import { getProgramme } from '@/modules/programmes/service';
import { listSourceDocuments } from '@/modules/documents/service';
import { ExtractionButton } from '@/app/admin/documents/extraction-button';
import { DocumentUploadForm } from './document-upload-form';

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function ProgrammeDocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const programme = await getProgramme(id);
  if (!programme) notFound();

  const documents = await listSourceDocuments(id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${programme.name} — Source documents`}
        description="Upload the mentoring-tool PDF, then extract its sections and evaluation items for review."
        action={
          <div className="flex gap-2">
            <Button variant="outline" render={<Link href={`/admin/programmes/${id}/units`} />}>
              Curriculum units
            </Button>
            <Button variant="outline" render={<Link href={`/admin/programmes/${id}/edit`} />}>
              Back to programme
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload a source document</CardTitle>
          <CardDescription>
            The PDF binary is stored in private object storage; only a reference is kept in the database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentUploadForm programmeId={id} />
        </CardContent>
      </Card>

      {documents.length === 0 ? (
        <EmptyState
          title="No documents yet"
          description="Upload the programme's mentoring tool to begin extraction."
        />
      ) : (
        <DataTable
          head={
            <tr>
              <th className="px-4 py-2.5 font-semibold">Document</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 font-semibold">Size</th>
              <th className="px-4 py-2.5 font-semibold">Runs</th>
              <th className="px-4 py-2.5 font-semibold">Versions</th>
              <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
            </tr>
          }
        >
          {documents.map((document) => (
            <tr key={document.id} className="hover:bg-muted/20">
              <td className="px-4 py-3">
                <Link
                  href={`/admin/documents/${document.id}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {document.fileName}
                </Link>
                <div className="text-xs text-muted-foreground">
                  {document.createdAt.toLocaleString()}
                </div>
              </td>
              <td className="px-4 py-3">
                <DocumentStatusBadge status={document.status} />
              </td>
              <td className="px-4 py-3 text-muted-foreground">{formatSize(document.fileSize)}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {document._count.extractionRuns}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {document._count.templateVersions}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <ExtractionButton
                    documentId={document.id}
                    label={document._count.extractionRuns > 0 ? 'Re-extract' : 'Extract'}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    render={<Link href={`/admin/documents/${document.id}`} />}
                  >
                    View
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
