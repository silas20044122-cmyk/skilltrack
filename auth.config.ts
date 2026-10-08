import type { NextAuthConfig } from 'next-auth';
import type { RoleCode, AccountStatus } from '@/types/auth';

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.roles = user.roles;
        token.primaryRole = user.primaryRole;
        token.status = user.status;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = (token.email as string) ?? '';
        session.user.name = (token.name as string) ?? '';
        session.user.roles = (token.roles as RoleCode[]) ?? [];
        session.user.primaryRole = (token.primaryRole as RoleCode) ?? 'TRAINEE';
        session.user.status = (token.status as AccountStatus) ?? 'ACTIVE';
      }
      return session;
    },
  },
  providers: [],
};
