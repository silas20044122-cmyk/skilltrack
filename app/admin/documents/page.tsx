import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DocumentStatusBadge, EmptyState, PageHeader } from '@/components/admin/page-parts';
import { listRecentSourceDocuments } from '@/modules/documents/service';

export default async function DocumentsPage() {
  const documents = await listRecentSourceDocuments(100);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Source documents"
        description="Mentoring-tool PDFs uploaded across all programmes, with their extraction history."
        action={
          <Button variant="outline" render={<Link href="/admin/programmes" />}>
            Go to programmes
          </Button>
        }
      />

      {documents.length === 0 ? (
        <EmptyState
          title="No source documents yet"
          description="Open a programme and upload its mentoring-tool PDF to begin."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-muted/30 text-left text-xs font-semibold text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Document</th>
                <th className="px-4 py-2.5 font-semibold">Programme</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold">Runs</th>
                <th className="px-4 py-2.5 font-semibold">Uploaded</th>
                <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {documents.map((document) => (
                <tr key={document.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/documents/${document.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {document.fileName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {document.programme ? (
                      <Link
                        href={`/admin/programmes/${document.programme.id}/documents`}
                        className="hover:underline"
                      >
                        {document.programme.name}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <DocumentStatusBadge status={document.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {document._count.extractionRuns}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {document.createdAt.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2.5 text-xs"
                      render={<Link href={`/admin/documents/${document.id}`} />}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
