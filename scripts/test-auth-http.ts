/**
 * SkillTrack — Authentication & Authorization HTTP Integration Tests
 *
 * Boots the real Next.js application (or uses BASE_URL if provided) and
 * verifies route protection, credential sign-in, cross-role denial, manual
 * URL bypass prevention, session contents, inactive-account behaviour and
 * logout at the HTTP layer.
 *
 * Usage:
 *   npm run test:auth:server
 *   BASE_URL=http://localhost:3000 npm run test:auth:server
 */

import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';

const PORT = process.env.TEST_PORT || '3311';
let BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

let passed = 0;
let total = 0;

function assert(condition: boolean, name: string, details?: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`  \u2713 PASS: ${name}`);
  } else {
    console.error(`  \u2717 FAIL: ${name}`);
    if (details) console.error(`    Details: ${details}`);
    process.exitCode = 1;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// --- Minimal cookie jar -----------------------------------------------------
const cookies = new Map<string, string>();

function storeCookies(res: Response) {
  const setCookies: string[] =
    typeof (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie ===
    'function'
      ? (res.headers as unknown as { getSetCookie: () => string[] }).getSetCookie()
      : [];

  for (const raw of setCookies) {
    const pair = raw.split(';')[0];
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const name = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1);
    const expired = /expires=thu, 01 jan 1970/i.test(raw) || value === '';
    if (expired) cookies.delete(name);
    else cookies.set(name, value);
  }
}

function cookieHeader(): string {
  return [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

async function req(pathname: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (cookies.size > 0) headers.set('cookie', cookieHeader());
  const res = await fetch(`${BASE_URL}${pathname}`, {
    ...init,
    headers,
    redirect: 'manual',
  });
  storeCookies(res);
  return res;
}

function location(res: Response): string {
  return res.headers.get('location') ?? '';
}

function isRedirect(res: Response): boolean {
  return res.status >= 300 && res.status < 400;
}

// --- Server lifecycle -------------------------------------------------------
let server: ChildProcess | undefined;

async function isReachable(url: string): Promise<boolean> {
  try {
    const res = await fetch(`${url}/login`, { redirect: 'manual' });
    return res.status < 500;
  } catch {
    return false;
  }
}

async function startServer() {
  // Reuse an already-running server (Next 16 allows only one dev server per
  // project directory, so spawning a second one would exit immediately).
  if (await isReachable(BASE_URL)) {
    console.log(`Using running server at ${BASE_URL}`);
    return;
  }

  const spawnUrl = `http://localhost:${PORT}`;
  const nextBin = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
  console.log(`Starting Next.js dev server on ${spawnUrl} ...`);
  server = spawn(process.execPath, [nextBin, 'dev', '-p', PORT], {
    stdio: 'ignore',
    env: { ...process.env },
  });

  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (await isReachable(spawnUrl)) {
      BASE_URL = spawnUrl;
      return;
    }
    // If the spawned server exited (e.g. another dev server holds the lock),
    // fall back to the default port.
    if (server.exitCode !== null && (await isReachable('http://localhost:3000'))) {
      BASE_URL = 'http://localhost:3000';
      console.log(`Spawned server exited; using running server at ${BASE_URL}`);
      return;
    }
    await sleep(1500);
  }
  throw new Error('Next.js server did not become ready in time');
}

function stopServer() {
  if (!server || server.killed) return;
  try {
    if (process.platform === 'win32' && server.pid) {
      spawn('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      server.kill('SIGTERM');
    }
  } catch {
    // best effort
  }
}

async function getCsrfToken(): Promise<string> {
  const res = await req('/api/auth/csrf');
  const data = (await res.json()) as { csrfToken: string };
  return data.csrfToken;
}

async function signIn(email: string, password: string): Promise<Response> {
  const csrfToken = await getCsrfToken();
  const body = new URLSearchParams({
    email,
    password,
    csrfToken,
    callbackUrl: `${BASE_URL}/dashboard`,
  });
  return req('/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
}

async function signOut(): Promise<Response> {
  const csrfToken = await getCsrfToken();
  const body = new URLSearchParams({ csrfToken, callbackUrl: `${BASE_URL}/login` });
  return req('/api/auth/signout', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
}

async function run() {
  console.log('\n======================================================');
  console.log('SkillTrack Sprint 2 — Auth HTTP Integration Tests');
  console.log('======================================================\n');

  await startServer();

  // --- 1. Unauthenticated access -------------------------------------------
  console.log('--- 1. Unauthenticated Route Protection ---');
  {
    const res = await req('/admin');
    assert(
      isRedirect(res) && location(res).includes('/login'),
      'Unauthenticated /admin redirects to /login (manual URL bypass denied)',
      `status=${res.status} location=${location(res)}`
    );

    const res2 = await req('/trainee');
    assert(
      isRedirect(res2) && location(res2).includes('/login'),
      'Unauthenticated /trainee redirects to /login',
      `status=${res2.status} location=${location(res2)}`
    );

    const loginRes = await req('/login');
    assert(loginRes.status === 200, 'Public /login is reachable', `status=${loginRes.status}`);

    const session = await req('/api/auth/session');
    const sessionJson = (await session.json()) as Record<string, unknown>;
    assert(
      session.status === 200 && !sessionJson?.user,
      'Unauthenticated session endpoint returns no user'
    );
  }

  // --- 2. Invalid credentials ----------------------------------------------
  console.log('\n--- 2. Invalid Credentials & Inactive Account ---');
  {
    const res = await signIn('admin@skilltrack.gov.tvet', 'WrongPassword999!');
    assert(
      isRedirect(res) && /error=/i.test(location(res)),
      'Invalid credentials do not create a session (error redirect)',
      `status=${res.status} location=${location(res)}`
    );
    cookies.clear();

    const res2 = await signIn('inactive@polytechnic.ac.ke', 'InactivePass123!');
    assert(
      isRedirect(res2) && /error=/i.test(location(res2)),
      'Inactive account cannot sign in (error redirect)',
      `status=${res2.status} location=${location(res2)}`
    );
    cookies.clear();
  }

  // --- 3. Admin sign-in & authorized access --------------------------------
  console.log('\n--- 3. ADMIN Sign-In & Authorized Access ---');
  {
    const loginRes = await signIn('admin@skilltrack.gov.tvet', 'AdminPass123!');
    assert(
      isRedirect(loginRes) && !/error=/i.test(location(loginRes)),
      'ADMIN signs in with valid credentials (no error redirect)',
      `status=${loginRes.status} location=${location(loginRes)}`
    );

    const session = await req('/api/auth/session');
    const sessionJson = (await session.json()) as {
      user?: { id?: string; roles?: string[]; primaryRole?: string };
    };
    assert(
      Boolean(sessionJson.user) &&
        sessionJson.user?.roles?.includes('ADMIN') === true &&
        sessionJson.user?.primaryRole === 'ADMIN',
      'Session exposes id, roles and primaryRole for the signed-in ADMIN',
      JSON.stringify(sessionJson)
    );
    assert(
      JSON.stringify(sessionJson).toLowerCase().indexOf('password') === -1,
      'Session payload does not leak password data'
    );

    const adminRes = await req('/admin');
    assert(adminRes.status === 200, 'ADMIN can access /admin', `status=${adminRes.status}`);

    const loginWhenAuthed = await req('/login');
    assert(
      isRedirect(loginWhenAuthed) && location(loginWhenAuthed).includes('/admin'),
      'Authenticated user visiting /login is redirected to /admin landing',
      `status=${loginWhenAuthed.status} location=${location(loginWhenAuthed)}`
    );

    // Cross-role denial: ADMIN -> /trainee
    const cross = await req('/trainee');
    assert(
      isRedirect(cross) && location(cross).includes('/unauthorized'),
      'ADMIN is denied /trainee and redirected to /unauthorized',
      `status=${cross.status} location=${location(cross)}`
    );
  }

  // --- 4. Logout -----------------------------------------------------------
  console.log('\n--- 4. Logout ---');
  {
    const out = await signOut();
    assert(
      isRedirect(out) || out.status === 200,
      'Sign out completes',
      `status=${out.status} location=${location(out)}`
    );

    const afterLogout = await req('/admin');
    assert(
      isRedirect(afterLogout) && location(afterLogout).includes('/login'),
      'After logout, protected route redirects to /login',
      `status=${afterLogout.status} location=${location(afterLogout)}`
    );
  }

  // --- 5. Trainee sign-in & cross-role denial ------------------------------
  console.log('\n--- 5. TRAINEE Sign-In & Cross-Role Denial ---');
  {
    cookies.clear();
    const loginRes = await signIn('trainee@polytechnic.ac.ke', 'TraineePass123!');
    assert(
      isRedirect(loginRes) && !/error=/i.test(location(loginRes)),
      'TRAINEE signs in successfully',
      `status=${loginRes.status} location=${location(loginRes)}`
    );

    const trainee = await req('/trainee');
    assert(trainee.status === 200, 'TRAINEE is authorized for /trainee', `status=${trainee.status}`);

    const admin = await req('/admin');
    assert(
      isRedirect(admin) && location(admin).includes('/unauthorized'),
      'Cross-role: TRAINEE typing /admin manually is DENIED',
      `status=${admin.status} location=${location(admin)}`
    );
  }

  console.log('\n======================================================');
  console.log(`HTTP Test Execution Finished: ${passed}/${total} Passed`);
  console.log('======================================================\n');
}

run()
  .catch((err) => {
    console.error('HTTP test suite error:', err);
    process.exitCode = 1;
  })
  .finally(() => {
    stopServer();
    setTimeout(() => process.exit(process.exitCode ?? 0), 500);
  });