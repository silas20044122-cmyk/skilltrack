import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState, PageHeader } from '@/components/admin/page-parts';
import { getInstitution } from '@/modules/institutions/service';
import { InstitutionForm } from './institution-form';

export default async function InstitutionPage() {
  const institution = await getInstitution();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institution"
        description="The institution is the root of the organizational hierarchy: Institution → Department → Programme → Trainee."
      />

      {!institution ? (
        <EmptyState
          title="No institution configured"
          description="Run `npm run db:seed` to create the development institution, then return to this page."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Institution details</CardTitle>
            <CardDescription>
              Changes here are recorded for future audit logging and apply across the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InstitutionForm institution={institution} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}