import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState, PageHeader } from '@/components/admin/page-parts';
import { listDepartments } from '@/modules/institutions/service';
import { ProgrammeForm } from '../programme-form';

export default async function NewProgrammePage() {
  const departments = await listDepartments();

  return (
    <div className="space-y-6">
      <PageHeader
        title="New programme"
        description="Programmes belong to a department."
        action={
          <Button variant="outline" render={<Link href="/admin/programmes" />}>
            Back to programmes
          </Button>
        }
      />
      {departments.length === 0 ? (
        <EmptyState
          title="No departments available"
          description="Create a department before adding programmes."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Programme details</CardTitle>
            <CardDescription>Codes must be unique within the institution.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProgrammeForm departments={departments} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}