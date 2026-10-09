import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader, StatusBadge } from '@/components/admin/page-parts';
import { ConfirmSubmit } from '@/components/admin/confirm-submit';
import { getInstitution } from '@/modules/institutions/service';
import { listProgrammeOptions } from '@/modules/programmes/service';
import { getUser } from '@/modules/users/service';
import { setUserStatusAction } from '../actions';
import { UserEditForm } from '../user-form';
import { UserRoleManager } from './user-role-manager';
import { UserPasswordForm } from './user-password-form';

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, programmes, institution] = await Promise.all([
    getUser(id),
    listProgrammeOptions(),
    getInstitution(),
  ]);

  if (!user) notFound();

  const roles = user.userRoles.map((ur) => ({ code: ur.role.code }));
  const isActive = user.status === 'ACTIVE';

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.name}
        description={user.email}
        action={
          <Button variant="outline" render={<Link href="/admin/users" />}>
            Back to users
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={user.status} />
        <ConfirmSubmit
          action={setUserStatusAction}
          fields={{ id: user.id, status: isActive ? 'INACTIVE' : 'ACTIVE' }}
          triggerLabel={isActive ? 'Deactivate account' : 'Activate account'}
          title={isActive ? 'Deactivate account?' : 'Activate account?'}
          description={
            isActive
              ? 'The user will be unable to sign in. Existing records and assignments are retained.'
              : 'The user will be able to sign in again.'
          }
          confirmLabel={isActive ? 'Deactivate' : 'Activate'}
          variant={isActive ? 'destructive' : 'default'}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account and profile</CardTitle>
          <CardDescription>
            Profile sections are shown based on the roles currently assigned below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserEditForm
            user={{
              id: user.id,
              name: user.name,
              email: user.email,
              status: user.status,
              roles: roles.map((r) => r.code),
              registrationNumber: user.traineeProfile?.registrationNumber ?? null,
              programmeId: user.traineeProfile?.programme?.id ?? null,
              companyName: user.mentorProfile?.companyName ?? null,
              jobTitle: user.mentorProfile?.jobTitle ?? null,
              contactEmail: user.mentorProfile?.contactEmail ?? null,
              phone: user.mentorProfile?.phone ?? null,
              designation: user.iloProfile?.designation ?? null,
              officeEmail: user.iloProfile?.officeEmail ?? null,
            }}
            programmes={programmes}
            institutionId={institution?.id}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Roles</CardTitle>
          <CardDescription>
            Assign additional roles or remove existing ones. Role changes take effect on the
            user&apos;s next sign-in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserRoleManager userId={user.id} roles={roles} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reset password</CardTitle>
          <CardDescription>Set a new password for this account.</CardDescription>
        </CardHeader>
        <CardContent>
          <UserPasswordForm userId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}