import type { ZodType } from 'zod';
import { actionFailure, type ActionFailure } from '@/lib/actions/result';

/**
 * Parse unknown input with a zod schema, returning either the typed value or a
 * ready-to-return ActionFailure containing per-field messages.
 */
export function parseWithSchema<T>(
  schema: { safeParse: (data: unknown) => { success: boolean; data?: T; error?: { issues: Array<{ path: PropertyKey[]; message: string }> } } },
  data: unknown
): { ok: true; data: T } | { ok: false; failure: ActionFailure } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { ok: true, data: result.data as T };
  }

  const fieldErrors: Record<string, string[]> = {};
  for (const issue of result.error?.issues ?? []) {
    const key = issue.path.length > 0 ? issue.path.map(String).join('.') : '_form';
    (fieldErrors[key] ??= []).push(issue.message);
  }

  return {
    ok: false,
    failure: actionFailure('Please correct the highlighted fields.', 'VALIDATION', fieldErrors),
  };
}

/** Read a string field from FormData, normalising null to undefined. */
export function fdString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === 'string' ? value : undefined;
}

/** Collect all values for a repeated FormData key (e.g. checkbox groups). */
export function fdStringAll(formData: FormData, key: string): string[] {
  return formData.getAll(key).filter((v): v is string => typeof v === 'string');
}

export type { ZodType };