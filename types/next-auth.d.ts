import type { DefaultSession } from 'next-auth';
import type { RoleCode, AccountStatus } from '@/types/auth';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string;
    roles: RoleCode[];
    primaryRole: RoleCode;
    status: AccountStatus;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      roles: RoleCode[];
      primaryRole: RoleCode;
      status: AccountStatus;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    roles?: RoleCode[];
    primaryRole?: RoleCode;
    status?: AccountStatus;
  }
}
