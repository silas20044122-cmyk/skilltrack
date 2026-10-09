import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, EmptyState, PageHeader, TemplateStatusBadge } from '@/components/admin/page-parts';
import { listTemplates } from '@/modules/templates/service';
import { listProgrammeOptions } from '@/modules/programmes/service';
import { CreateTemplateForm } from './lifecycle-forms';

export default async function TemplatesPage() {
  const [templates, programmes] = await Promise.all([
    listTemplates(),
    listProgrammeOptions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mentoring templates"
        description="Versioned mentoring tools per programme. A template holds numbered drafts and exactly one current published version."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create a blank template</CardTitle>
          <CardDescription>
            Starts a new template with an empty draft version. You can also create templates by
            uploading a PDF and running extraction.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {programmes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active programmes exist yet. Create a programme before adding templates.
            </p>
          ) : (
            <CreateTemplateForm programmes={programmes} />
          )}
        </CardContent>
      </Card>

      {templates.length === 0 ? (
        <EmptyState
          title="No templates yet"
          description="Create a blank template above, or upload a mentoring-tool PDF on a programme."
        />
      ) : (
        <DataTable
          head={
            <tr>
              <th className="px-4 py-2.5 font-semibold">Template</th>
              <th className="px-4 py-2.5 font-semibold">Programme</th>
              <th className="px-4 py-2.5 font-semibold">Current published</th>
              <th className="px-4 py-2.5 font-semibold">Drafts</th>
              <th className="px-4 py-2.5 font-semibold">Source</th>
              <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
            </tr>
          }
        >
          {templates.map((template) => {
            const currentPublished = template.versions.find((v) => v.status === 'PUBLISHED');
            const draftCount = template.versions.filter(
              (v) => v.status === 'DRAFT' || v.status === 'IN_REVIEW'
            ).length;
            return (
              <tr key={template.id} className="hover:bg-muted/20">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/templates/${template.id}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {template.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {template.programme.code} — {template.programme.name}
                </td>
                <td className="px-4 py-3">
                  {currentPublished ? (
                    <span className="flex items-center gap-2">
                      <TemplateStatusBadge status="PUBLISHED" />
                      <span className="text-xs text-muted-foreground">
                        v{currentPublished.versionNumber} · {currentPublished._count.sections} sections
                      </span>
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Not published</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{draftCount}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {template.sourceDocument?.fileName ?? 'Manual'}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    render={<Link href={`/admin/templates/${template.id}`} />}
                  >
                    Open
                  </Button>
                </td>
              </tr>
            );
          })}
        </DataTable>
      )}
    </div>
  );
}
