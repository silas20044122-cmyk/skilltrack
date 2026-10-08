import { prisma } from '@/lib/db/prisma';
import { verifyPassword, hashPassword } from '@/lib/auth/password';
import type { AuthenticatedUser, RoleCode, AccountStatus } from '@/types/auth';

/**
 * Deterministic Role Hierarchy for Multi-Role Landing Experience
 * Higher priority roles take precedence for default dashboard landing.
 */
export const ROLE_PRIORITY: Record<RoleCode, number> = {
  ADMIN: 4,
  ILO: 3,
  MENTOR: 2,
  TRAINEE: 1,
};

export function resolvePrimaryRole(roles: RoleCode[]): RoleCode {
  if (roles.length === 0) return 'TRAINEE';
  return [...roles].sort((a, b) => ROLE_PRIORITY[b] - ROLE_PRIORITY[a])[0];
}

export function getDefaultLandingPath(role: RoleCode): string {
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
 * Development Seed User Record Definition
 */
export interface SeedUserRecord {
  id: string;
  email: string;
  name: string;
  passwordPlain: string;
  passwordHash: string;
  status: AccountStatus;
  roles: RoleCode[];
}

/**
 * Development seed accounts
 */
export const SEED_USERS: SeedUserRecord[] = [
  {
    id: 'usr_admin_001',
    email: 'admin@skilltrack.gov.tvet',
    name: 'Dr. Sarah Kimani (System Admin)',
    passwordPlain: 'AdminPass123!',
    passwordHash: '',
    status: 'ACTIVE',
    roles: ['ADMIN'],
  },
  {
    id: 'usr_mentor_001',
    email: 'mentor@workplace.co.ke',
    name: 'Eng. David Ochieng (Workplace Mentor)',
    passwordPlain: 'MentorPass123!',
    passwordHash: '',
    status: 'ACTIVE',
    roles: ['MENTOR'],
  },
  {
    id: 'usr_trainee_001',
    email: 'trainee@polytechnic.ac.ke',
    name: 'Faith Wanjiku (TVET Trainee)',
    passwordPlain: 'TraineePass123!',
    passwordHash: '',
    status: 'ACTIVE',
    roles: ['TRAINEE'],
  },
  {
    id: 'usr_ilo_001',
    email: 'ilo@institute.ac.ke',
    name: 'Prof. Patrick Mwangi (ILO Officer)',
    passwordPlain: 'IloPass123!',
    passwordHash: '',
    status: 'ACTIVE',
    roles: ['ILO'],
  },
  {
    id: 'usr_coord_001',
    email: 'coordinator@polytechnic.ac.ke',
    name: 'Grace Mutua (Admin & ILO)',
    passwordPlain: 'CoordPass123!',
    passwordHash: '',
    status: 'ACTIVE',
    roles: ['ADMIN', 'ILO'],
  },
  {
    id: 'usr_inactive_001',
    email: 'inactive@polytechnic.ac.ke',
    name: 'Kelvin Kiprop (Suspended Trainee)',
    passwordPlain: 'InactivePass123!',
    passwordHash: '',
    status: 'INACTIVE',
    roles: ['TRAINEE'],
  },
];

let seedHashesInitialized = false;
async function ensureSeedHashes() {
  if (seedHashesInitialized) return;
  for (const user of SEED_USERS) {
    if (!user.passwordHash) {
      user.passwordHash = await hashPassword(user.passwordPlain);
    }
  }
  seedHashesInitialized = true;
}

/**
 * Retrieve User with Roles by Email
 * Connects to Prisma database if available, otherwise queries development seed registry.
 */
export async function getUserByEmail(
  rawEmail: string
): Promise<{ user: AuthenticatedUser; passwordHash: string } | null> {
  const email = rawEmail.trim().toLowerCase();
  await ensureSeedHashes();

  try {
    const dbUser = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (dbUser) {
      const roles = dbUser.userRoles.map((ur) => ur.role.code as RoleCode);
      const primaryRole = resolvePrimaryRole(roles);

      return {
        user: {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          status: dbUser.status as AccountStatus,
          roles,
          primaryRole,
        },
        passwordHash: dbUser.passwordHash,
      };
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Prisma query failed, utilizing development user store fallback');
    }
  }

  // Fallback to Development Seed Store
  const seed = SEED_USERS.find((u) => u.email.toLowerCase() === email);
  if (!seed) return null;

  return {
    user: {
      id: seed.id,
      email: seed.email,
      name: seed.name,
      status: seed.status,
      roles: seed.roles,
      primaryRole: resolvePrimaryRole(seed.roles),
    },
    passwordHash: seed.passwordHash,
  };
}

/**
 * Validate credentials against password hash and enforce account status rules.
 */
export async function authenticateCredentials(
  rawEmail: string,
  plainPassword: string
): Promise<{ user?: AuthenticatedUser; error?: string }> {
  const record = await getUserByEmail(rawEmail);

  // Return generic error to prevent email enumeration
  if (!record) {
    return { error: 'INVALID_CREDENTIALS' };
  }

  // Account status check: Inactive accounts are prohibited from authenticating
  if (record.user.status === 'INACTIVE') {
    return { error: 'ACCOUNT_INACTIVE' };
  }

  const isValid = await verifyPassword(plainPassword, record.passwordHash);
  if (!isValid) {
    return { error: 'INVALID_CREDENTIALS' };
  }

  return { user: record.user };
}
