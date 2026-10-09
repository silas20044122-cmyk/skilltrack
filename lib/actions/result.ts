/**
 * Shared server-action result contract.
 *
 * Every administrative server action returns an `ActionResult` so that forms
 * can render consistent success and error feedback without leaking internal
 * implementation details.
 */

export type ActionErrorCode =
  | 'VALIDATION'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'DUPLICATE'
  | 'INVALID_REFERENCE'
  | 'INVALID_STATE'
  | 'CONFLICT'
  | 'UNKNOWN';

export interface ActionSuccess<T = void> {
  ok: true;
  data?: T;
  message?: string;
}

export interface ActionFailure {
  ok: false;
  error: string;
  code: ActionErrorCode;
  fieldErrors?: Record<string, string[]>;
}

export type ActionResult<T = void> = ActionSuccess<T> | ActionFailure;

export function actionSuccess<T = void>(data?: T, message?: string): ActionSuccess<T> {
  return { ok: true, data, message };
}

export function actionFailure(
  error: string,
  code: ActionErrorCode = 'UNKNOWN',
  fieldErrors?: Record<string, string[]>
): ActionFailure {
  return { ok: false, error, code, fieldErrors };
}