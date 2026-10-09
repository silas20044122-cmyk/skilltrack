/**
 * SkillTrack â€” Authentication & RBAC Comprehensive Test Suite
 * Validates Sprint 2 requirements per engineering specification.
 */

import { authenticateCredentials, resolvePrimaryRole } from '../lib/auth/user-store';
import {
  canAccessRoute,
  canAccessTraineeRecord,
  getDefaultLandingPath,
} from '../lib/permissions/rbac';
import { authConfig } from '../auth.config';
import type { SessionUser } from '../types/auth';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, failureDetails?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  âœ“ PASS: ${testName}`);
  } else {
    console.error(`  âœ— FAIL: ${testName}`);
    if (failureDetails) {
      console.error(`    Details: ${failureDetails}`);
    }
    process.exitCode = 1;
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('SkillTrack Sprint 2 â€” Authentication & RBAC Test Suite');
  console.log('======================================================\n');

  // ---------------------------------------------------------------------------
  // SECTION 1: CREDENTIALS & AUTHENTICATION
  // ---------------------------------------------------------------------------
  console.log('--- 1. Authentication & Credential Verification ---');

  // Test Admin Login
  const adminAuth = await authenticateCredentials('admin@skilltrack.gov.tvet', 'AdminPass123!');
  assert(
    adminAuth.user !== undefined && adminAuth.user.roles.includes('ADMIN'),
    'Admin user authenticates successfully with ADMIN role',
    JSON.stringify(adminAuth)
  );

  // Test Mentor Login
  const mentorAuth = await authenticateCredentials('mentor@workplace.co.ke', 'MentorPass123!');
  assert(
    mentorAuth.user !== undefined && mentorAuth.user.roles.includes('MENTOR'),
    'Mentor user authenticates successfully with MENTOR role'
  );

  // Test Trainee Login
  const traineeAuth = await authenticateCredentials('trainee@polytechnic.ac.ke', 'TraineePass123!');
  assert(
    traineeAuth.user !== undefined && traineeAuth.user.roles.includes('TRAINEE'),
    'Trainee user authenticates successfully with TRAINEE role'
  );

  // Test ILO Login
  const iloAuth = await authenticateCredentials('ilo@institute.ac.ke', 'IloPass123!');
  assert(
    iloAuth.user !== undefined && iloAuth.user.roles.includes('ILO'),
    'ILO user authenticates successfully with ILO role'
  );

  // Test Invalid Password
  const badPassAuth = await authenticateCredentials('admin@skilltrack.gov.tvet', 'WrongPassword999!');
  assert(
    badPassAuth.user === undefined && badPassAuth.error === 'INVALID_CREDENTIALS',
    'Invalid password returns generic INVALID_CREDENTIALS error'
  );

  // Test Non-existent Email
  const badEmailAuth = await authenticateCredentials('nonexistent@user.com', 'AnyPassword123!');
  assert(
    badEmailAuth.user === undefined && badEmailAuth.error === 'INVALID_CREDENTIALS',
    'Non-existent account returns generic INVALID_CREDENTIALS error (enumeration prevention)'
  );

  // Test Inactive Account Authentication
  const inactiveAuth = await authenticateCredentials('inactive@polytechnic.ac.ke', 'InactivePass123!');
  assert(
    inactiveAuth.user === undefined && inactiveAuth.error === 'ACCOUNT_INACTIVE',
    'Inactive user authentication is strictly blocked with ACCOUNT_INACTIVE error'
  );

  // Account enumeration: wrong password on an INACTIVE account must NOT
  // reveal that the account exists (must be indistinguishable from a
  // wrong password on an unknown account).
  const inactiveBadPass = await authenticateCredentials(
    'inactive@polytechnic.ac.ke',
    'WrongPassword999!'
  );
  assert(
    inactiveBadPass.user === undefined && inactiveBadPass.error === 'INVALID_CREDENTIALS',
    'Inactive account with wrong password returns generic INVALID_CREDENTIALS (no status leak)',
    JSON.stringify(inactiveBadPass)
  );

  // Timing-independent ordering sanity: unknown email + inactive email with
  // wrong password produce the identical error code.
  assert(
    inactiveBadPass.error === badEmailAuth.error,
    'Enumeration prevention: unknown email and inactive-account failures return identical errors'
  );

  // ---------------------------------------------------------------------------
  // SECTION 2: MULTI-ROLE & PRIORITY LANDING RESOLUTION
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Multi-Role & Priority Landing Resolution ---');

  const coordAuth = await authenticateCredentials('coordinator@polytechnic.ac.ke', 'CoordPass123!');
  assert(
    coordAuth.user !== undefined &&
      coordAuth.user.roles.includes('ADMIN') &&
      coordAuth.user.roles.includes('ILO'),
    'Multi-role user preserves all assigned roles (ADMIN + ILO)'
  );

  const coordPrimaryRole = resolvePrimaryRole(['ADMIN', 'ILO']);
  assert(
    coordPrimaryRole === 'ADMIN',
    'Multi-role priority resolves ADMIN over ILO for default landing'
  );

  assert(
    getDefaultLandingPath('ADMIN') === '/admin' &&
      getDefaultLandingPath('ILO') === '/ilo' &&
      getDefaultLandingPath('MENTOR') === '/mentor' &&
      getDefaultLandingPath('TRAINEE') === '/trainee',
    'Default landing paths map deterministically to role portals'
  );

  // ---------------------------------------------------------------------------
  // SECTION 3: ROUTE PROTECTION & RBAC POLICIES
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Route Protection & Authorization Policies ---');

  const adminSessionUser: SessionUser = {
    id: 'usr_admin_001',
    email: 'admin@skilltrack.gov.tvet',
    name: 'Admin',
    roles: ['ADMIN'],
    primaryRole: 'ADMIN',
    status: 'ACTIVE',
  };

  const mentorSessionUser: SessionUser = {
    id: 'usr_mentor_001',
    email: 'mentor@workplace.co.ke',
    name: 'Mentor',
    roles: ['MENTOR'],
    primaryRole: 'MENTOR',
    status: 'ACTIVE',
  };

  const traineeSessionUser: SessionUser = {
    id: 'usr_trainee_001',
    email: 'trainee@polytechnic.ac.ke',
    name: 'Trainee',
    roles: ['TRAINEE'],
    primaryRole: 'TRAINEE',
    status: 'ACTIVE',
  };

  const iloSessionUser: SessionUser = {
    id: 'usr_ilo_001',
    email: 'ilo@institute.ac.ke',
    name: 'ILO Officer',
    roles: ['ILO'],
    primaryRole: 'ILO',
    status: 'ACTIVE',
  };

  const multiRoleSessionUser: SessionUser = {
    id: 'usr_coord_001',
    email: 'coordinator@polytechnic.ac.ke',
    name: 'Coordinator',
    roles: ['ADMIN', 'ILO'],
    primaryRole: 'ADMIN',
    status: 'ACTIVE',
  };

  const inactiveSessionUser: SessionUser = {
    id: 'usr_inactive_001',
    email: 'inactive@polytechnic.ac.ke',
    name: 'Suspended',
    roles: ['TRAINEE'],
    primaryRole: 'TRAINEE',
    status: 'INACTIVE',
  };

  // Unauthenticated checks
  assert(
    canAccessRoute(null, '/login').allowed === true &&
      canAccessRoute(null, '/').allowed === true &&
      canAccessRoute(null, '/unauthorized').allowed === true,
    'Public routes (/, /login, /unauthorized) are accessible without session'
  );

  assert(
    canAccessRoute(null, '/admin').allowed === false &&
      canAccessRoute(null, '/admin').code === 'UNAUTHENTICATED',
    'Unauthenticated access to /admin is denied with UNAUTHENTICATED'
  );

  assert(
    canAccessRoute(null, '/mentor').allowed === false &&
      canAccessRoute(null, '/trainee').allowed === false &&
      canAccessRoute(null, '/ilo').allowed === false,
    'Unauthenticated access to /mentor, /trainee, /ilo is denied'
  );

  // Authorized role checks
  assert(
    canAccessRoute(adminSessionUser, '/admin').allowed === true,
    'ADMIN is authorized for /admin'
  );

  assert(
    canAccessRoute(mentorSessionUser, '/mentor').allowed === true,
    'MENTOR is authorized for /mentor'
  );

  assert(
    canAccessRoute(traineeSessionUser, '/trainee').allowed === true,
    'TRAINEE is authorized for /trainee'
  );

  assert(
    canAccessRoute(iloSessionUser, '/ilo').allowed === true,
    'ILO is authorized for /ilo'
  );

  // Cross-Role Protection (Negative tests)
  assert(
    canAccessRoute(traineeSessionUser, '/admin').allowed === false &&
      canAccessRoute(traineeSessionUser, '/admin').code === 'FORBIDDEN',
    'Cross-role: TRAINEE access to /admin is strictly FORBIDDEN'
  );

  assert(
    canAccessRoute(mentorSessionUser, '/admin').allowed === false &&
      canAccessRoute(mentorSessionUser, '/admin').code === 'FORBIDDEN',
    'Cross-role: MENTOR access to /admin is strictly FORBIDDEN'
  );

  assert(
    canAccessRoute(traineeSessionUser, '/mentor').allowed === false &&
      canAccessRoute(traineeSessionUser, '/mentor').code === 'FORBIDDEN',
    'Cross-role: TRAINEE access to /mentor is strictly FORBIDDEN'
  );

  assert(
    canAccessRoute(mentorSessionUser, '/trainee').allowed === false &&
      canAccessRoute(mentorSessionUser, '/trainee').code === 'FORBIDDEN',
    'Cross-role: MENTOR access to /trainee is strictly FORBIDDEN'
  );

  assert(
    canAccessRoute(iloSessionUser, '/admin').allowed === false &&
      canAccessRoute(iloSessionUser, '/admin').code === 'FORBIDDEN',
    'Cross-role: ILO access to /admin is strictly FORBIDDEN'
  );

  // Multi-role checks
  assert(
    canAccessRoute(multiRoleSessionUser, '/admin').allowed === true &&
      canAccessRoute(multiRoleSessionUser, '/ilo').allowed === true &&
      canAccessRoute(multiRoleSessionUser, '/mentor').allowed === false,
    'Multi-role user can access both /admin and /ilo, but not /mentor'
  );

  // Inactive session check
  assert(
    canAccessRoute(inactiveSessionUser, '/trainee').allowed === false &&
      canAccessRoute(inactiveSessionUser, '/trainee').code === 'INACTIVE_ACCOUNT',
    'Inactive user session access is rejected with INACTIVE_ACCOUNT'
  );

  // ---------------------------------------------------------------------------
  // SECTION 4: RELATIONSHIP-BASED AUTHORIZATION EXTENSION
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Relationship-Based Policy Extension (Forward Compatibility) ---');

  const traineeId = 'usr_trainee_001';

  assert(
    canAccessTraineeRecord(adminSessionUser, traineeId).allowed === true,
    'ADMIN has global relationship authority over trainee records'
  );

  assert(
    canAccessTraineeRecord(iloSessionUser, traineeId).allowed === true,
    'ILO has institutional relationship authority over trainee records'
  );

  assert(
    canAccessTraineeRecord(traineeSessionUser, traineeId).allowed === true,
    'TRAINEE can access their own record'
  );

  assert(
    canAccessTraineeRecord(traineeSessionUser, 'other_trainee_999').allowed === false,
    'TRAINEE cannot access another trainee record'
  );

  assert(
    canAccessTraineeRecord(mentorSessionUser, traineeId, { targetTraineeId: traineeId }).allowed === true,
    'MENTOR with assigned relationship context can access trainee record'
  );

  assert(
    canAccessTraineeRecord(mentorSessionUser, traineeId, { targetTraineeId: 'different_trainee' }).allowed === false,
    'MENTOR without matching assigned relationship is FORBIDDEN'
  );

  // ---------------------------------------------------------------------------
  // SECTION 5: SESSION DESIGN (Auth.js JWT/session callbacks)
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Session Design & Data Exposure ---');

  const jwtFn = authConfig.callbacks?.jwt;
  const sessionFn = authConfig.callbacks?.session;

  assert(
    typeof jwtFn === 'function' && typeof sessionFn === 'function',
    'Auth.js jwt and session callbacks are configured'
  );

  if (jwtFn && sessionFn) {
    const token = await jwtFn({
      token: { name: 'Faith Wanjiku', email: 'trainee@polytechnic.ac.ke' },
      user: {
        id: 'usr_trainee_001',
        email: 'trainee@polytechnic.ac.ke',
        name: 'Faith Wanjiku',
        roles: ['TRAINEE'],
        primaryRole: 'TRAINEE',
        status: 'ACTIVE',
        // Simulated sensitive fields that must never survive into the session
        passwordHash: 'pbkdf2$DO-NOT-LEAK',
        password: 'DO-NOT-LEAK',
      },
    } as never);

    assert(
      token &&
        (token as any).id === 'usr_trainee_001' &&
        Array.isArray((token as any).roles) &&
        (token as any).roles.includes('TRAINEE') &&
        (token as any).primaryRole === 'TRAINEE' &&
        (token as any).status === 'ACTIVE',
      'jwt callback copies identity, roles, primaryRole and status onto the token'
    );

    const session = await sessionFn({
      session: {
        user: { name: '', email: '', image: null },
        expires: new Date(Date.now() + 60_000).toISOString(),
      },
      token: token as never,
    } as never);

    const sessionUser = (session as { user?: Record<string, unknown> }).user ?? {};
    assert(
      sessionUser.id === 'usr_trainee_001' &&
        (sessionUser.roles as string[]).includes('TRAINEE') &&
        sessionUser.primaryRole === 'TRAINEE' &&
        sessionUser.status === 'ACTIVE',
      'session callback exposes id, roles, primaryRole and status to the application'
    );

    assert(
      sessionUser.passwordHash === undefined &&
        sessionUser.password === undefined &&
        JSON.stringify(session).indexOf('DO-NOT-LEAK') === -1 &&
        JSON.stringify(session).toLowerCase().indexOf('password') === -1,
      'session payload never contains passwords or password hashes'
    );
  }

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n======================================================');
  console.log(`Test Execution Finished: ${passedTests}/${totalTests} Passed`);
  console.log('======================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});




