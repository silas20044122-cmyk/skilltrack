import { requireRole } from '@/lib/auth/session';
import { AdminShell } from '@/components/admin/admin-shell';

// Administrative pages are auth-gated and read live data; never statically
// prerender them (this also avoids database access during `next build`).
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole('ADMIN');
  return <AdminShell user={user}>{children}</AdminShell>;
}