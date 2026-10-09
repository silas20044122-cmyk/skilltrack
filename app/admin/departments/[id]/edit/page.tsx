import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/admin/page-parts';
import { getDepartment } from '@/modules/institutions/service';
import { DepartmentForm } from '../../department-form';

export default async function EditDepartmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const department = await getDepartment(id);
  if (!department) return notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${department.name}`}
        description="Update the department name, code or description."
        action={
          <Button variant="outline" render={<Link href="/admin/departments" />}>
            Back to departments
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Department details</CardTitle>
          <CardDescription>Codes must be unique within the institution.</CardDescription>
        </CardHeader>
        <CardContent>
          <DepartmentForm department={department} />
        </CardContent>
      </Card>
    </div>
  );
}