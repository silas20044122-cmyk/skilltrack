import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/admin/page-parts';
import { listDepartments } from '@/modules/institutions/service';
import { getProgramme } from '@/modules/programmes/service';
import { ProgrammeForm } from '../../programme-form';

export default async function EditProgrammePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [programme, departments] = await Promise.all([getProgramme(id), listDepartments()]);

  if (!programme) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${programme.name}`}
        description="Update programme details or move it to another department."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" render={<Link href={`/admin/programmes/${id}/units`} />}>
              Curriculum units
            </Button>
            <Button variant="outline" render={<Link href={`/admin/programmes/${id}/documents`} />}>
              Source documents
            </Button>
            <Button variant="outline" render={<Link href="/admin/programmes" />}>
              Back to programmes
            </Button>
          </div>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Programme details</CardTitle>
          <CardDescription>Codes must be unique within the institution.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProgrammeForm
            departments={departments}
            programme={{
              id: programme.id,
              name: programme.name,
              code: programme.code,
              level: programme.level,
              description: programme.description,
              departmentId: programme.departmentId,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}