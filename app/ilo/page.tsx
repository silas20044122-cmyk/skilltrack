import { requireRole } from '@/lib/auth/session';
import { RoleShell } from '@/components/shared/role-shell';

export default async function IloLandingPage() {
  const user = await requireRole('ILO');

  return (
    <RoleShell
      user={user}
      pageRole="ILO"
      pageTitle="Industry Liaison Office (ILO)"
      pageDescription="Institutional liaison dashboard for coordinating industry placement agreements, allocating industry mentors, and overseeing trainee cohorts."
    />
  );
}
