import { getCurrentUser } from '@/lib/auth/session';
import { hasAnyRole, hasRole } from '@/lib/permissions/rbac';
import type { SessionUser } from '@/types/auth';

/**
 * Non-redirecting guards for use inside server actions and API handlers.
 *
 * Pages use `requireRole` / `requireAuth` (which redirect). Server actions
 * must not redirect on failure — they return an ActionResult — so they use
 * these helpers and check for `null`.
 */

export async function getAdminUser(): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  return hasRole(user, 'ADMIN') ? user : null;
}

export async function getActiveUser(): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  return user && user.status === 'ACTIVE' ? user : null;
}

export async function getOversightUser(): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  return hasAnyRole(user, ['ADMIN', 'ILO']) ? user : null;
}