'use client';

import { useActionState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FieldError, FormAlert, FormRow, SubmitButton } from '@/components/admin/form-ui';
import { createCurriculumUnitAction, updateCurriculumUnitAction } from './actions';

interface CurriculumUnitFormProps {
  programmeId: string;
  unit?: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    position: number;
  };
}

export function CurriculumUnitForm({ programmeId, unit }: CurriculumUnitFormProps) {
  const action = unit ? updateCurriculumUnitAction : createCurriculumUnitAction;
  const [state, formAction] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="programmeId" value={programmeId} />
      {unit ? <input type="hidden" name="id" value={unit.id} /> : null}
      <FormAlert state={state} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormRow label="Code" htmlFor="code" className="sm:col-span-1">
          <Input id="code" name="code" defaultValue={unit?.code ?? ''} required />
          <FieldError state={state} name="code" />
        </FormRow>
        <FormRow label="Name" htmlFor="name" className="sm:col-span-1">
          <Input id="name" name="name" defaultValue={unit?.name ?? ''} required />
          <FieldError state={state} name="name" />
        </FormRow>
        <FormRow label="Order" htmlFor="position" hint="Lower numbers appear first.">
          <Input
            id="position"
            name="position"
            type="number"
            min={0}
            defaultValue={unit?.position ?? 0}
          />
          <FieldError state={state} name="position" />
        </FormRow>
      </div>

      <FormRow label="Description" htmlFor="description">
        <Textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={unit?.description ?? ''}
        />
        <FieldError state={state} name="description" />
      </FormRow>

      <SubmitButton>{unit ? 'Save changes' : 'Add curriculum unit'}</SubmitButton>
    </form>
  );
}
