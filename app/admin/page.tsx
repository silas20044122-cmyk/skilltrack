import { requireRole } from '@/lib/auth/session';
import { RoleShell } from '@/components/shared/role-shell';

export default async function AdminLandingPage() {
  const user = await requireRole('ADMIN');

  return (
    <RoleShell
      user={user}
      pageRole="ADMIN"
      pageTitle="TVET System Administration"
      pageDescription="System administration gateway for managing TVET institutions, user provisioning, role assignments, and national audit logs."
    />
  );
}
