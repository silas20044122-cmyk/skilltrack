import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/admin/page-parts';
import { DepartmentForm } from '../department-form';

export default function NewDepartmentPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New department"
        description="Create a department within the institution."
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
          <DepartmentForm />
        </CardContent>
      </Card>
    </div>
  );
}