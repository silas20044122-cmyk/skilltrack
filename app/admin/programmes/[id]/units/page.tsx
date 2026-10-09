import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, EmptyState, PageHeader, StatusBadge } from '@/components/admin/page-parts';
import { ConfirmSubmit } from '@/components/admin/confirm-submit';
import { getProgramme } from '@/modules/programmes/service';
import { listCurriculumUnits } from '@/modules/curriculum/service';
import { CurriculumUnitForm } from './curriculum-unit-form';
import { setCurriculumUnitStatusAction } from './actions';

export default async function CurriculumUnitsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const programme = await getProgramme(id);
  if (!programme) notFound();

  const units = await listCurriculumUnits(id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${programme.name} — Curriculum units`}
        description="Curriculum units are configurable competency areas. Template sections are mapped to units during review."
        action={
          <Button variant="outline" render={<Link href={`/admin/programmes/${id}/edit`} />}>
            Back to programme
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a curriculum unit</CardTitle>
          <CardDescription>Codes are unique within the programme.</CardDescription>
        </CardHeader>
        <CardContent>
          <CurriculumUnitForm programmeId={id} />
        </CardContent>
      </Card>

      {units.length === 0 ? (
        <EmptyState
          title="No curriculum units yet"
          description="Add the units for this programme so extracted sections can be mapped to them."
        />
      ) : (
        <DataTable
          head={
            <tr>
              <th className="px-4 py-2.5 font-semibold">Order</th>
              <th className="px-4 py-2.5 font-semibold">Code</th>
              <th className="px-4 py-2.5 font-semibold">Name</th>
              <th className="px-4 py-2.5 font-semibold">Mapped sections</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
            </tr>
          }
        >
          {units.map((unit) => (
            <tr key={unit.id} className="hover:bg-muted/20">
              <td className="px-4 py-3 text-muted-foreground">{unit.position}</td>
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{unit.code}</td>
              <td className="px-4 py-3 font-medium text-foreground">{unit.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{unit._count.sectionLinks}</td>
              <td className="px-4 py-3">
                <StatusBadge status={unit.status} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    render={<Link href={`/admin/programmes/${id}/units/${unit.id}`} />}
                  >
                    Edit
                  </Button>
                  <ConfirmSubmit
                    action={setCurriculumUnitStatusAction}
                    fields={{
                      id: unit.id,
                      programmeId: id,
                      status: unit.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                    }}
                    triggerLabel={unit.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    title={
                      unit.status === 'ACTIVE' ? 'Deactivate unit?' : 'Activate unit?'
                    }
                    description={
                      unit.status === 'ACTIVE'
                        ? 'The unit will no longer be offered when mapping sections.'
                        : 'The unit will be available again when mapping sections.'
                    }
                    confirmLabel={unit.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    variant={unit.status === 'ACTIVE' ? 'destructive' : 'default'}
                  />
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
