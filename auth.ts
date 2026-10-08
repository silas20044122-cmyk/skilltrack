import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from '@/auth.config';
import { authenticateCredentials } from '@/lib/auth/user-store';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email).trim();
        const password = String(credentials.password);

        const result = await authenticateCredentials(email, password);

        if (result.error === 'ACCOUNT_INACTIVE') {
          throw new Error('ACCOUNT_INACTIVE');
        }

        if (result.error || !result.user) {
          return null;
        }

        return {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          roles: result.user.roles,
          primaryRole: result.user.primaryRole,
          status: result.user.status,
        };
      },
    }),
  ],
});
