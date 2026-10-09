import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/admin/page-parts';
import { getCurriculumUnit } from '@/modules/curriculum/service';
import { CurriculumUnitForm } from '../curriculum-unit-form';

export default async function EditCurriculumUnitPage({
  params,
}: {
  params: Promise<{ id: string; unitId: string }>;
}) {
  const { id, unitId } = await params;
  const unit = await getCurriculumUnit(unitId);
  if (!unit || unit.programmeId !== id) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${unit.name}`}
        description="Update the unit code, name or ordering."
        action={
          <Button variant="outline" render={<Link href={`/admin/programmes/${id}/units`} />}>
            Back to units
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Curriculum unit details</CardTitle>
          <CardDescription>Codes must be unique within the programme.</CardDescription>
        </CardHeader>
        <CardContent>
          <CurriculumUnitForm
            programmeId={id}
            unit={{
              id: unit.id,
              name: unit.name,
              code: unit.code,
              description: unit.description,
              position: unit.position,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
