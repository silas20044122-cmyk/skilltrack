/**
 * Development-only test account hints for the login page quick-fill helper.
 *
 * This module is intentionally client-safe: it must never import Prisma,
 * bcrypt, or the server-side user store. The list is only returned outside
 * of production builds so that these development credentials are stripped
 * from production bundles.
 */

export interface DevAccountHint {
  email: string;
  password: string;
  roles: string[];
  status: 'ACTIVE' | 'INACTIVE';
}

const DEV_ACCOUNT_HINTS: DevAccountHint[] = [
  {
    email: 'admin@skilltrack.gov.tvet',
    password: 'AdminPass123!',
    roles: ['ADMIN'],
    status: 'ACTIVE',
  },
  {
    email: 'mentor@workplace.co.ke',
    password: 'MentorPass123!',
    roles: ['MENTOR'],
    status: 'ACTIVE',
  },
  {
    email: 'trainee@polytechnic.ac.ke',
    password: 'TraineePass123!',
    roles: ['TRAINEE'],
    status: 'ACTIVE',
  },
  {
    email: 'ilo@institute.ac.ke',
    password: 'IloPass123!',
    roles: ['ILO'],
    status: 'ACTIVE',
  },
  {
    email: 'coordinator@polytechnic.ac.ke',
    password: 'CoordPass123!',
    roles: ['ADMIN', 'ILO'],
    status: 'ACTIVE',
  },
  {
    email: 'inactive@polytechnic.ac.ke',
    password: 'InactivePass123!',
    roles: ['TRAINEE'],
    status: 'INACTIVE',
  },
];

export function getDevAccountHints(): DevAccountHint[] {
  if (process.env.NODE_ENV === 'production') {
    return [];
  }
  return DEV_ACCOUNT_HINTS;
}
