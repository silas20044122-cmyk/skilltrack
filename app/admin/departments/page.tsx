import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DataTable, EmptyState, PageHeader, StatusBadge } from '@/components/admin/page-parts';
import { ConfirmSubmit } from '@/components/admin/confirm-submit';
import { listDepartments } from '@/modules/institutions/service';
import { setDepartmentStatusAction } from './actions';

export default async function DepartmentsPage() {
  const departments = await listDepartments();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description="Departments group related programmes within the institution."
        action={<Button render={<Link href="/admin/departments/new" />}>New department</Button>}
      />

      {departments.length === 0 ? (
        <EmptyState
          title="No departments yet"
          description="Create the first department to start organising programmes."
        />
      ) : (
        <DataTable
          head={
            <tr>
              <th className="px-4 py-2.5 font-semibold">Name</th>
              <th className="px-4 py-2.5 font-semibold">Code</th>
              <th className="px-4 py-2.5 font-semibold">Programmes</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
            </tr>
          }
        >
          {departments.map((department) => (
            <tr key={department.id} className="hover:bg-muted/20">
              <td className="px-4 py-3 font-medium text-foreground">{department.name}</td>
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{department.code}</td>
              <td className="px-4 py-3 text-muted-foreground">{department._count.programmes}</td>
              <td className="px-4 py-3">
                <StatusBadge status={department.status} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    render={<Link href={`/admin/departments/${department.id}/edit`} />}
                  >
                    Edit
                  </Button>
                  <ConfirmSubmit
                    action={setDepartmentStatusAction}
                    fields={{
                      id: department.id,
                      status: department.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                    }}
                    triggerLabel={department.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    title={
                      department.status === 'ACTIVE'
                        ? 'Deactivate department?'
                        : 'Activate department?'
                    }
                    description={
                      department.status === 'ACTIVE'
                        ? 'The department will be hidden from new programme creation. Existing programmes are unaffected.'
                        : 'The department will be available for new programmes again.'
                    }
                    confirmLabel={department.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    variant={department.status === 'ACTIVE' ? 'destructive' : 'default'}
                  />
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}