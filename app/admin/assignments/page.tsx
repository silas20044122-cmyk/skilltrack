import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DataTable, EmptyState, PageHeader, StatusBadge } from '@/components/admin/page-parts';
import { ConfirmSubmit } from '@/components/admin/confirm-submit';
import { listAssignments } from '@/modules/assignments/service';
import { updateAssignmentAction } from './actions';

function formatDate(date: Date | null) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString();
}

export default async function AssignmentsPage() {
  const assignments = await listAssignments();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mentor assignments"
        description="Assign workplace mentors to trainees. A trainee may have more than one mentor over time."
        action={<Button render={<Link href="/admin/assignments/new" />}>New assignment</Button>}
      />

      {assignments.length === 0 ? (
        <EmptyState
          title="No assignments yet"
          description="Create an assignment to pair a mentor with a trainee."
        />
      ) : (
        <DataTable
          head={
            <tr>
              <th className="px-4 py-2.5 font-semibold">Mentor</th>
              <th className="px-4 py-2.5 font-semibold">Trainee</th>
              <th className="px-4 py-2.5 font-semibold">Programme</th>
              <th className="px-4 py-2.5 font-semibold">Start</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
            </tr>
          }
        >
          {assignments.map((assignment) => {
            const active = assignment.status === 'ACTIVE';
            return (
              <tr key={assignment.id} className="hover:bg-muted/20">
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{assignment.mentor.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {assignment.mentor.mentorProfile?.companyName ?? assignment.mentor.email}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{assignment.trainee.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {assignment.trainee.traineeProfile?.registrationNumber ??
                      assignment.trainee.email}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {assignment.trainee.traineeProfile?.programme?.code ?? '—'}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(assignment.startDate)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={assignment.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <ConfirmSubmit
                    action={updateAssignmentAction}
                    fields={{ id: assignment.id, status: active ? 'ENDED' : 'ACTIVE' }}
                    triggerLabel={active ? 'End' : 'Reactivate'}
                    title={active ? 'End this assignment?' : 'Reactivate this assignment?'}
                    description={
                      active
                        ? 'The mentor will no longer be assigned to this trainee. The record is retained for history.'
                        : 'The mentor will be assigned to this trainee again.'
                    }
                    confirmLabel={active ? 'End assignment' : 'Reactivate'}
                    variant={active ? 'destructive' : 'default'}
                  />
                </td>
              </tr>
            );
          })}
        </DataTable>
      )}
    </div>
  );
}