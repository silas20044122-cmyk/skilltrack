import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, EmptyState, PageHeader, StatusBadge } from '@/components/admin/page-parts';
import { listUsers } from '@/modules/users/service';
import type { RoleCode } from '@/types/auth';
import { UserRoleFilter } from './user-role-filter';

const ROLE_CODES: RoleCode[] = ['ADMIN', 'ILO', 'MENTOR', 'TRAINEE'];

export default async function UsersPage(props: {
  searchParams?: Promise<{ role?: string }>;
}) {
  const searchParams = await props.searchParams;
  const roleParam = searchParams?.role?.toUpperCase();
  const role = ROLE_CODES.includes(roleParam as RoleCode) ? (roleParam as RoleCode) : undefined;

  const users = await listUsers(role);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage accounts, roles and role-specific profiles. Identity is separate from profiles."
        action={
          <div className="flex items-center gap-2">
            <UserRoleFilter value={role ?? 'ALL'} />
            <Button render={<Link href="/admin/users/new" />}>New user</Button>
          </div>
        }
      />

      {users.length === 0 ? (
        <EmptyState
          title={role ? `No ${role} users` : 'No users yet'}
          description={
            role
              ? 'No accounts with this role. Try another role or clear the filter.'
              : 'Create the first user account.'
          }
        />
      ) : (
        <DataTable
          head={
            <tr>
              <th className="px-4 py-2.5 font-semibold">Name</th>
              <th className="px-4 py-2.5 font-semibold">Email</th>
              <th className="px-4 py-2.5 font-semibold">Roles</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
            </tr>
          }
        >
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-muted/20">
              <td className="px-4 py-3 font-medium text-foreground">{user.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {user.userRoles.map((ur) => (
                    <Badge key={ur.roleId} variant="outline" className="font-mono text-[10px]">
                      {ur.role.code}
                    </Badge>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={user.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  render={<Link href={`/admin/users/${user.id}`} />}
                >
                  Manage
                </Button>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}