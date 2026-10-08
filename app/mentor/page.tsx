import { requireRole } from '@/lib/auth/session';
import { RoleShell } from '@/components/shared/role-shell';

export default async function MentorLandingPage() {
  const user = await requireRole('MENTOR');

  return (
    <RoleShell
      user={user}
      pageRole="MENTOR"
      pageTitle="Workplace Mentor Portal"
      pageDescription="Industry mentor portal for reviewing student daily technical logbooks, verifying competencies, and conducting on-site attachment reviews."
    />
  );
}
