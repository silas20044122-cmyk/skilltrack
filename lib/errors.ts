import { Prisma } from '@prisma/client';
import { actionFailure, type ActionFailure } from '@/lib/actions/result';

/**
 * Domain error with a safe, user-facing message and a stable error code.
 * Server-side detail is logged, never returned to the client.
 */
export class AppError extends Error {
  code: ActionFailure['code'];
  fieldErrors?: Record<string, string[]>;

  constructor(
    message: string,
    code: ActionFailure['code'] = 'UNKNOWN',
    fieldErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

const FRIENDLY_UNIQUE: Record<string, string> = {
  code: 'That code is already in use.',
  email: 'That email address is already registered.',
  registrationNumber: 'That registration number is already in use.',
  userId: 'A profile already exists for this user.',
};

/**
 * Convert an unknown thrown value into a safe ActionFailure.
 * Database errors are translated into generic, user-friendly messages and are
 * never surfaced verbatim.
 */
export function toActionFailure(error: unknown): ActionFailure {
  if (error instanceof AppError) {
    return actionFailure(error.message, error.code, error.fieldErrors);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const target = normalizeTarget(error.meta?.target);

    if (error.code === 'P2002') {
      const friendly = target ? FRIENDLY_UNIQUE[target] : undefined;
      return actionFailure(
        friendly ?? 'A record with those details already exists.',
        'DUPLICATE',
        target ? { [target]: [friendly ?? 'Already in use.'] } : undefined
      );
    }

    if (error.code === 'P2003' || error.code === 'P2014') {
      return actionFailure(
        'That action references a record that does not exist or is still in use.',
        'INVALID_REFERENCE'
      );
    }

    if (error.code === 'P2025') {
      return actionFailure('The requested record could not be found.', 'NOT_FOUND');
    }
  }

  console.error('[action-error]', error);
  return actionFailure('Something went wrong. Please try again.', 'UNKNOWN');
}

function normalizeTarget(target: unknown): string | undefined {
  const parts = Array.isArray(target)
    ? target.map(String)
    : typeof target === 'string'
      ? target.split('_')
      : [];
  if (parts.length === 0) return undefined;

  // Prisma reports `target` as an array of column names on PostgreSQL, but as
  // an index name (e.g. `Institution_code_key`) on other engines. Prefer a
  // segment we recognise so both shapes map to a friendly field name.
  for (let i = parts.length - 1; i >= 0; i -= 1) {
    if (FRIENDLY_UNIQUE[parts[i]]) return parts[i];
  }
  return parts[parts.length - 1];
}