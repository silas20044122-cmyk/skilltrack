import type { SessionUser, RoleCode, PolicyEvaluation, RelationshipContext } from '@/types/auth';

/**
 * Route Permission Mapping
 * Route prefixes mapped to required roles.
 */
export const ROUTE_PERMISSIONS: Array<{
  prefix: string;
  requiredRoles: RoleCode[];
  exact?: boolean;
}> = [
  { prefix: '/admin', requiredRoles: ['ADMIN'] },
  { prefix: '/mentor', requiredRoles: ['MENTOR'] },
  { prefix: '/trainee', requiredRoles: ['TRAINEE'] },
  { prefix: '/ilo', requiredRoles: ['ILO'] },
];

/**
 * Deterministic default landing destination by role
 */
export function getDefaultLandingPath(role?: RoleCode): string {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'ILO':
      return '/ilo';
    case 'MENTOR':
      return '/mentor';
    case 'TRAINEE':
      return '/trainee';
    default:
      return '/login';
  }
}

/**
 * Check if user possesses a specific role.
 */
export function hasRole(user: SessionUser | null | undefined, role: RoleCode): boolean {
  if (!user || user.status !== 'ACTIVE') return false;
  return user.roles.includes(role);
}

/**
 * Check if user possesses at least one of the specified roles.
 */
export function hasAnyRole(
  user: SessionUser | null | undefined,
  roles: RoleCode[]
): boolean {
  if (!user || user.status !== 'ACTIVE') return false;
  return roles.some((r) => user.roles.includes(r));
}

/**
 * Check if user possesses all specified roles.
 */
export function hasAllRoles(
  user: SessionUser | null | undefined,
  roles: RoleCode[]
): boolean {
  if (!user || user.status !== 'ACTIVE') return false;
  return roles.every((r) => user.roles.includes(r));
}

/**
 * Evaluate Route Access Policy
 * Determines whether the user has permission to navigate to a target pathname.
 */
export function canAccessRoute(
  user: SessionUser | null | undefined,
  pathname: string
): PolicyEvaluation {
  // Public routes allowed for everyone
  const publicPaths = ['/login', '/unauthorized', '/api/auth'];
  if (pathname === '/' || publicPaths.some((p) => pathname.startsWith(p))) {
    return { allowed: true, code: 'AUTHORIZED' };
  }

  // Any other route requires an authenticated user
  if (!user) {
    return {
      allowed: false,
      code: 'UNAUTHENTICATED',
      reason: 'Authentication required to access this resource.',
    };
  }

  // Active account check
  if (user.status !== 'ACTIVE') {
    return {
      allowed: false,
      code: 'INACTIVE_ACCOUNT',
      reason: 'Account is deactivated or suspended. Please contact administrator.',
    };
  }

  // General dashboard accessible to any authenticated active user
  if (pathname === '/dashboard') {
    return { allowed: true, code: 'AUTHORIZED' };
  }

  // Check matching route prefix
  for (const rule of ROUTE_PERMISSIONS) {
    if (pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)) {
      const isAllowed = rule.requiredRoles.some((role) => user.roles.includes(role));
      if (!isAllowed) {
        return {
          allowed: false,
          code: 'FORBIDDEN',
          reason: `Access denied. Route requires one of the following roles: [${rule.requiredRoles.join(', ')}].`,
        };
      }
      return { allowed: true, code: 'AUTHORIZED' };
    }
  }

  return { allowed: true, code: 'AUTHORIZED' };
}

/**
 * Scope / Relationship-Based Policy Engine Extension
 * Forward-compatible stub for mentor-trainee bindings.
 */
export function canAccessTraineeRecord(
  user: SessionUser | null | undefined,
  traineeUserId: string,
  context?: RelationshipContext
): PolicyEvaluation {
  if (!user || user.status !== 'ACTIVE') {
    return { allowed: false, code: 'UNAUTHENTICATED' };
  }

  // ADMIN and ILO have global oversight over trainee records
  if (hasAnyRole(user, ['ADMIN', 'ILO'])) {
    return { allowed: true, code: 'AUTHORIZED' };
  }

  // Trainee can access their own record
  if (hasRole(user, 'TRAINEE') && user.id === traineeUserId) {
    return { allowed: true, code: 'AUTHORIZED' };
  }

  // Mentor access: requires relationship check
  if (hasRole(user, 'MENTOR')) {
    if (context?.targetTraineeId === traineeUserId) {
      return { allowed: true, code: 'AUTHORIZED' };
    }
    return {
      allowed: false,
      code: 'FORBIDDEN',
      reason: 'Mentor is not assigned to this trainee.',
    };
  }

  return { allowed: false, code: 'FORBIDDEN' };
}
