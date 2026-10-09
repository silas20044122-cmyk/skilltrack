'use client';

import { useActionState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FieldError, FormAlert, FormRow, SubmitButton } from '@/components/admin/form-ui';
import { createDepartmentAction, updateDepartmentAction } from './actions';

interface DepartmentFormProps {
  department?: {
    id: string;
    name: string;
    code: string;
    description: string | null;
  };
}

export function DepartmentForm({ department }: DepartmentFormProps) {
  const action = department ? updateDepartmentAction : createDepartmentAction;
  const [state, formAction] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      {department ? <input type="hidden" name="id" value={department.id} /> : null}
      <FormAlert state={state} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormRow label="Name" htmlFor="name">
          <Input id="name" name="name" defaultValue={department?.name ?? ''} required />
          <FieldError state={state} name="name" />
        </FormRow>
        <FormRow label="Code" htmlFor="code" hint="Unique within the institution, e.g. ICT.">
          <Input id="code" name="code" defaultValue={department?.code ?? ''} required />
          <FieldError state={state} name="code" />
        </FormRow>
      </div>

      <FormRow label="Description" htmlFor="description">
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={department?.description ?? ''}
        />
        <FieldError state={state} name="description" />
      </FormRow>

      <SubmitButton>{department ? 'Save changes' : 'Create department'}</SubmitButton>
    </form>
  );
}