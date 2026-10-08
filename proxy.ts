import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canAccessRoute, getDefaultLandingPath } from '@/lib/permissions/rbac';
import type { SessionUser } from '@/types/auth';

export default auth((req) => {
  const { nextUrl } = req;
  const sessionUser = req.auth?.user as unknown as SessionUser | undefined;
  const pathname = nextUrl.pathname;

  // Evaluate server-side authorization policy
  const policy = canAccessRoute(sessionUser ?? null, pathname);

  if (!policy.allowed) {
    if (policy.code === 'UNAUTHENTICATED') {
      const loginUrl = new URL('/login', nextUrl.origin);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (policy.code === 'INACTIVE_ACCOUNT' || policy.code === 'FORBIDDEN') {
      const unauthorizedUrl = new URL('/unauthorized', nextUrl.origin);
      unauthorizedUrl.searchParams.set('reason', policy.reason || 'Access denied');
      unauthorizedUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(unauthorizedUrl);
    }
  }

  // If already authenticated and active, redirect /login to primary role dashboard
  if (pathname === '/login' && sessionUser && sessionUser.status === 'ACTIVE') {
    const destination = getDefaultLandingPath(sessionUser.primaryRole);
    return NextResponse.redirect(new URL(destination, nextUrl.origin));
  }

  // Redirect /dashboard to primary role dashboard
  if (pathname === '/dashboard' && sessionUser && sessionUser.status === 'ACTIVE') {
    const destination = getDefaultLandingPath(sessionUser.primaryRole);
    return NextResponse.redirect(new URL(destination, nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/admin/:path*',
    '/mentor/:path*',
    '/trainee/:path*',
    '/ilo/:path*',
    '/dashboard/:path*',
    '/dashboard',
    '/login',
  ],
};
