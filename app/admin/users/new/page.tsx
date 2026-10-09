import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/admin/page-parts';
import { getInstitution } from '@/modules/institutions/service';
import { listProgrammeOptions } from '@/modules/programmes/service';
import { UserCreateForm } from '../user-form';

export default async function NewUserPage() {
  const [programmes, institution] = await Promise.all([
    listProgrammeOptions(),
    getInstitution(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="New user"
        description="Create an account and assign one or more roles. Profile fields depend on the selected roles."
        action={
          <Button variant="outline" render={<Link href="/admin/users" />}>
            Back to users
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account and roles</CardTitle>
          <CardDescription>
            A user must have at least one role. Role-specific profile sections appear as roles are
            selected.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserCreateForm programmes={programmes} institutionId={institution?.id} />
        </CardContent>
      </Card>
    </div>
  );
}