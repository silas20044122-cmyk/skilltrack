import { requireAuth } from '@/lib/auth/session';
import { getDefaultLandingPath } from '@/lib/permissions/rbac';
import { redirect } from 'next/navigation';

export default async function DashboardRedirectPage() {
  const user = await requireAuth();
  const destination = getDefaultLandingPath(user.primaryRole);
  redirect(destination);
}
