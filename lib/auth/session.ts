import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import type { SessionUser, RoleCode } from '@/types/auth';
import { hasRole, hasAnyRole } from '@/lib/permissions/rbac';

/**
 * Retrieve the current authenticated session user on the server.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as unknown as SessionUser;
}

/**
 * Server-Side Gate: Require authentication.
 * Redirects unauthenticated requests to login.
 */
export async function requireAuth(callbackUrl?: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user || user.status !== 'ACTIVE') {
    const target = callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/login';
    redirect(target);
  }
  return user;
}

/**
 * Server-Side Gate: Require a specific role.
 * Redirects unauthorized requests to /unauthorized.
 */
export async function requireRole(role: RoleCode): Promise<SessionUser> {
  const user = await requireAuth();
  if (!hasRole(user, role)) {
    redirect(`/unauthorized?reason=${encodeURIComponent(`Requires ${role} role`)}`);
  }
  return user;
}

/**
 * Server-Side Gate: Require any of the specified roles.
 */
export async function requireAnyRole(roles: RoleCode[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!hasAnyRole(user, roles)) {
    redirect(`/unauthorized?reason=${encodeURIComponent(`Requires one of: ${roles.join(', ')}`)}`);
  }
  return user;
}
