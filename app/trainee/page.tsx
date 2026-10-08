import { requireRole } from '@/lib/auth/session';
import { RoleShell } from '@/components/shared/role-shell';

export default async function TraineeLandingPage() {
  const user = await requireRole('TRAINEE');

  return (
    <RoleShell
      user={user}
      pageRole="TRAINEE"
      pageTitle="TVET Trainee Portal"
      pageDescription="Student attachment workspace for submitting workplace logbooks, attaching practical evidence, and monitoring TVET competency milestones."
    />
  );
}
