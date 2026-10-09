/**
 * SkillTrack - Sprint 3 Administrative Validation & Error-Mapping Test Suite
 *
 * Offline (database-independent) checks for the validation schemas and the
 * error translation layer that every administrative server action relies on.
 */

import { Prisma } from '@prisma/client';
import {
  assignmentCreateSchema,
  assignmentStatusEnum,
  codeField,
  departmentSchema,
  institutionSchema,
  programmeSchema,
  roleEnum,
  statusEnum,
  userCreateSchema,
  userUpdateSchema,
} from '../lib/validation/schemas';
import { AppError, toActionFailure } from '../lib/errors';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, failureDetails?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  PASS: ${testName}`);
  } else {
    console.error(`  FAIL: ${testName}`);
    if (failureDetails) console.error(`    Details: ${failureDetails}`);
    process.exitCode = 1;
  }
}

function prismaKnownError(code: string, meta?: Record<string, unknown>) {
  return new Prisma.PrismaClientKnownRequestError('Database error', {
    code,
    clientVersion: '6.12.0',
    meta,
  });
}

const VALID_UUID = '11111111-1111-4111-8111-111111111111';

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('SkillTrack Sprint 3 - Administrative Validation Test Suite');
  console.log('======================================================\n');

  // ---------------------------------------------------------------------------
  console.log('--- 1. Code Field Normalisation ---');
  assert(codeField.parse('ict') === 'ICT', 'Lowercase code is normalised to uppercase');
  assert(codeField.parse(' dict-l6 ') === 'DICT-L6', 'Code is trimmed and uppercased');
  assert(!codeField.safeParse('a').success, 'Single-character code is rejected');
  assert(!codeField.safeParse('has space').success, 'Code with a space is rejected');
  assert(!codeField.safeParse('bad/slash').success, 'Code with a slash is rejected');

  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Institution Schema ---');
  const instOk = institutionSchema.safeParse({
    name: 'Rift Valley National Polytechnic',
    code: 'rvnp',
    description: '',
    email: '',
    phone: '',
    address: '',
  });
  assert(instOk.success, 'Valid institution input parses');
  assert(instOk.success && instOk.data.code === 'RVNP', 'Institution code is normalised');
  assert(
    instOk.success && instOk.data.email === undefined && instOk.data.description === undefined,
    'Empty optional strings become undefined'
  );
  assert(
    !institutionSchema.safeParse({ name: 'X', code: 'AB', email: 'not-an-email' }).success,
    'Invalid email and too-short name are rejected'
  );

  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Department Schema ---');
  assert(
    departmentSchema.safeParse({ name: 'ICT', code: 'ICT' }).success,
    'Valid department input parses'
  );
  assert(!departmentSchema.safeParse({ name: 'I', code: 'ICT' }).success, 'Short name rejected');

  // ---------------------------------------------------------------------------
  console.log('\n--- 3b. Programme Schema ---');
  assert(
    programmeSchema.safeParse({ departmentId: VALID_UUID, name: 'Diploma', code: 'd-l6' }).success,
    'Valid programme input parses'
  );
  assert(
    !programmeSchema.safeParse({ name: 'X', code: 'C1', departmentId: 'not-a-uuid' }).success,
    'Non-UUID department id is rejected'
  );

  // ---------------------------------------------------------------------------
  console.log('\n--- 3. User Create Schema ---');
  const userOk = userCreateSchema.safeParse({
    name: 'Jane Trainee',
    email: 'jane@example.com',
    password: 'Password123!',
    status: 'ACTIVE',
    roles: ['TRAINEE'],
    registrationNumber: 'REG-001',
    programmeId: VALID_UUID,
  });
  assert(userOk.success, 'Valid trainee user parses');
  assert(
    !userCreateSchema.safeParse({
      name: 'Jane',
      email: 'jane@example.com',
      password: 'Password123!',
      roles: [],
    }).success,
    'At least one role is required'
  );
  assert(
    !userCreateSchema.safeParse({
      name: 'Jane',
      email: 'not-an-email',
      password: 'Password123!',
      roles: ['MENTOR'],
    }).success,
    'Invalid email is rejected'
  );
  assert(
    !userCreateSchema.safeParse({
      name: 'Jane',
      email: 'jane@example.com',
      password: 'short',
      roles: ['MENTOR'],
    }).success,
    'Short password is rejected'
  );
  const defaulted = userCreateSchema.safeParse({
    name: 'Jane',
    email: 'jane@example.com',
    password: 'Password123!',
    roles: ['MENTOR'],
  });
  assert(
    defaulted.success && defaulted.data.status === 'ACTIVE',
    'Status defaults to ACTIVE when omitted'
  );
  assert(
    !userCreateSchema.safeParse({
      name: 'Jane',
      email: 'jane@example.com',
      password: 'Password123!',
      roles: ['SUPERUSER'],
    }).success,
    'Unknown role code is rejected'
  );
  assert(
    !userUpdateSchema.safeParse({ name: 'J', email: 'jane@example.com', status: 'ACTIVE' }).success,
    'User update schema rejects a too-short name'
  );

  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Assignment Schema & Date Coercion ---');
  const asg = assignmentCreateSchema.safeParse({
    mentorId: VALID_UUID,
    traineeId: VALID_UUID,
    startDate: '2026-01-15',
    notes: '',
  });
  assert(asg.success, 'Valid assignment parses');
  assert(
    asg.success && asg.data.startDate instanceof Date && asg.data.notes === undefined,
    'startDate is coerced to a Date and blank notes become undefined'
  );
  const asgBlank = assignmentCreateSchema.safeParse({
    mentorId: VALID_UUID,
    traineeId: VALID_UUID,
    startDate: '',
  });
  assert(asgBlank.success && asgBlank.data.startDate === undefined, 'Blank start date is undefined');
  assert(
    !assignmentCreateSchema.safeParse({ mentorId: 'nope', traineeId: VALID_UUID }).success,
    'Non-uuid mentor id is rejected'
  );
  assert(
    assignmentStatusEnum.safeParse('ENDED').success && !assignmentStatusEnum.safeParse('DELETED').success,
    'Assignment status only accepts ACTIVE or ENDED'
  );

  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Enums ---');
  assert(
    roleEnum.safeParse('ADMIN').success && !roleEnum.safeParse('admin').success,
    'Role enum is case-sensitive uppercase'
  );
  assert(
    statusEnum.safeParse('INACTIVE').success && !statusEnum.safeParse('DELETED').success,
    'Status enum only accepts ACTIVE or INACTIVE'
  );

  // ---------------------------------------------------------------------------
  console.log('\n--- 6. Error Translation (toActionFailure) ---');
  const appError = toActionFailure(
    new AppError('Bad input', 'VALIDATION', { code: ['Code is required.'] })
  );
  assert(
    appError.ok === false &&
      appError.code === 'VALIDATION' &&
      appError.error === 'Bad input' &&
      appError.fieldErrors?.code?.[0] === 'Code is required.',
    'AppError preserves message, code and field errors'
  );

  const dup = toActionFailure(prismaKnownError('P2002', { target: ['email'] }));
  assert(
    dup.ok === false &&
      dup.code === 'DUPLICATE' &&
      dup.error === 'That email address is already registered.' &&
      dup.fieldErrors?.email !== undefined,
    'Prisma P2002 on email becomes a friendly DUPLICATE error'
  );

  const dupCode = toActionFailure(prismaKnownError('P2002', { target: 'Institution_code_key' }));
  assert(
    dupCode.ok === false && dupCode.error === 'That code is already in use.',
    'Prisma P2002 target string is normalised to a field name'
  );

  const notFound = toActionFailure(prismaKnownError('P2025'));
  assert(
    notFound.ok === false && notFound.code === 'NOT_FOUND',
    'Prisma P2025 becomes NOT_FOUND'
  );

  const refErr = toActionFailure(prismaKnownError('P2003'));
  assert(
    refErr.ok === false && refErr.code === 'INVALID_REFERENCE',
    'Prisma P2003 becomes INVALID_REFERENCE'
  );

  const originalConsoleError = console.error;
  console.error = () => {};
  const unknown = toActionFailure(new Error('secret database detail'));
  console.error = originalConsoleError;
  assert(
    unknown.ok === false &&
      unknown.code === 'UNKNOWN' &&
      unknown.error.indexOf('secret') === -1,
    'Unknown errors are generic and never leak internal detail'
  );

  // ---------------------------------------------------------------------------
  console.log('\n======================================================');
  console.log(`Test Execution Finished: ${passedTests}/${totalTests} Passed`);
  console.log('======================================================\n');

  if (passedTests !== totalTests) process.exit(1);
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});