import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState, PageHeader } from '@/components/admin/page-parts';
import { listMentorOptions, listTraineeOptions } from '@/modules/users/service';
import { AssignmentForm } from '../assignment-form';

export default async function NewAssignmentPage() {
  const [mentors, trainees] = await Promise.all([listMentorOptions(), listTraineeOptions()]);
  const missing = mentors.length === 0 || trainees.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="New assignment"
        description="Pair an active workplace mentor with an active trainee."
        action={
          <Button variant="outline" render={<Link href="/admin/assignments" />}>
            Back to assignments
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assignment details</CardTitle>
          <CardDescription>
            Only active mentors and trainees appear in the selectors.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {missing ? (
            <EmptyState
              title="Not enough users to assign"
              description="You need at least one active mentor and one active trainee. Create them under Users first."
            />
          ) : (
            <AssignmentForm mentors={mentors} trainees={trainees} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}