import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DataTable, EmptyState, PageHeader, StatusBadge } from '@/components/admin/page-parts';
import { ConfirmSubmit } from '@/components/admin/confirm-submit';
import { listProgrammes } from '@/modules/programmes/service';
import { setProgrammeStatusAction } from './actions';

export default async function ProgrammesPage() {
  const programmes = await listProgrammes();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Programmes"
        description="Programmes belong to departments and are assigned to trainee profiles."
        action={<Button render={<Link href="/admin/programmes/new" />}>New programme</Button>}
      />

      {programmes.length === 0 ? (
        <EmptyState
          title="No programmes yet"
          description="Create a department first, then add programmes to it."
        />
      ) : (
        <DataTable
          head={
            <tr>
              <th className="px-4 py-2.5 font-semibold">Name</th>
              <th className="px-4 py-2.5 font-semibold">Code</th>
              <th className="px-4 py-2.5 font-semibold">Department</th>
              <th className="px-4 py-2.5 font-semibold">Trainees</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
            </tr>
          }
        >
          {programmes.map((programme) => (
            <tr key={programme.id} className="hover:bg-muted/20">
              <td className="px-4 py-3 font-medium text-foreground">
                {programme.name}
                {programme.level ? (
                  <span className="ml-2 text-xs text-muted-foreground">{programme.level}</span>
                ) : null}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{programme.code}</td>
              <td className="px-4 py-3 text-muted-foreground">{programme.department.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{programme._count.trainees}</td>
              <td className="px-4 py-3">
                <StatusBadge status={programme.status} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    render={<Link href={`/admin/programmes/${programme.id}/edit`} />}
                  >
                    Edit
                  </Button>
                  <ConfirmSubmit
                    action={setProgrammeStatusAction}
                    fields={{
                      id: programme.id,
                      status: programme.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                    }}
                    triggerLabel={programme.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    title={
                      programme.status === 'ACTIVE'
                        ? 'Deactivate programme?'
                        : 'Activate programme?'
                    }
                    description={
                      programme.status === 'ACTIVE'
                        ? 'The programme will no longer be selectable for new trainee profiles.'
                        : 'The programme will be available again.'
                    }
                    confirmLabel={programme.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    variant={programme.status === 'ACTIVE' ? 'destructive' : 'default'}
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