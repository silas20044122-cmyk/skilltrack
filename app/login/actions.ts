'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

export interface LoginActionState {
  error?: string;
  success?: boolean;
}

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;
  const callbackUrl = (formData.get('callbackUrl') as string) || '/dashboard';

  if (!email || !password) {
    return { error: 'Please enter both email and password.' };
  }

  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: callbackUrl,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      const errStr = String(error.cause?.err?.message || error.message);
      if (errStr.includes('ACCOUNT_INACTIVE')) {
        return {
          error: 'This account has been deactivated. Please contact your institution administrator.',
        };
      }
      return { error: 'Invalid email or password.' };
    }

    // Re-throw Next.js redirect errors
    if (
      error &&
      typeof error === 'object' &&
      'digest' in error &&
      typeof (error as { digest: string }).digest === 'string' &&
      (error as { digest: string }).digest.startsWith('NEXT_REDIRECT')
    ) {
      throw error;
    }

    const genericMsg = String((error as Error)?.message || '');
    if (genericMsg.includes('ACCOUNT_INACTIVE')) {
      return {
        error: 'This account has been deactivated. Please contact your institution administrator.',
      };
    }

    return { error: 'Invalid email or password.' };
  }
}
