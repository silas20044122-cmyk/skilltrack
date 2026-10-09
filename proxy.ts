import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from '@/auth.config';
import { canAccessRoute, getDefaultLandingPath } from '@/lib/permissions/rbac';
import type { SessionUser } from '@/types/auth';

// Edge-safe Auth.js instance: middleware must never import the Node-only
// provider chain in `@/auth` (Prisma, bcryptjs). Session JWTs are decoded
// and the shared callbacks in `auth.config.ts` populate `req.auth`.
const { auth: middleware } = NextAuth(authConfig);

export default middleware((req) => {
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
