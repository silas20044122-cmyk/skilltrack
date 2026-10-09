'use client';

import { useActionState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FieldError, FormAlert, FormRow, SubmitButton } from '@/components/admin/form-ui';
import { createProgrammeAction, updateProgrammeAction } from './actions';

interface DepartmentOption {
  id: string;
  name: string;
  code: string;
  status: string;
}

interface ProgrammeFormProps {
  departments: DepartmentOption[];
  programme?: {
    id: string;
    name: string;
    code: string;
    level: string | null;
    description: string | null;
    departmentId: string;
  };
}

export function ProgrammeForm({ departments, programme }: ProgrammeFormProps) {
  const action = programme ? updateProgrammeAction : createProgrammeAction;
  const [state, formAction] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      {programme ? <input type="hidden" name="id" value={programme.id} /> : null}
      <FormAlert state={state} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormRow label="Department" htmlFor="departmentId">
          <Select name="departmentId" defaultValue={programme?.departmentId ?? null}>
            <SelectTrigger id="departmentId">
              <SelectValue placeholder="Select a department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((department) => (
                <SelectItem key={department.id} value={department.id}>
                  {department.name} ({department.code})
                  {department.status === 'INACTIVE' ? ' — inactive' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError state={state} name="departmentId" />
        </FormRow>
        <FormRow label="Level" htmlFor="level" hint="Optional, e.g. Level 4 / Level 6.">
          <Input id="level" name="level" defaultValue={programme?.level ?? ''} />
          <FieldError state={state} name="level" />
        </FormRow>
        <FormRow label="Name" htmlFor="name">
          <Input id="name" name="name" defaultValue={programme?.name ?? ''} required />
          <FieldError state={state} name="name" />
        </FormRow>
        <FormRow label="Code" htmlFor="code" hint="Unique within the institution, e.g. DICT-L6.">
          <Input id="code" name="code" defaultValue={programme?.code ?? ''} required />
          <FieldError state={state} name="code" />
        </FormRow>
      </div>

      <FormRow label="Description" htmlFor="description">
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={programme?.description ?? ''}
        />
        <FieldError state={state} name="description" />
      </FormRow>

      <SubmitButton>{programme ? 'Save changes' : 'Create programme'}</SubmitButton>
    </form>
  );
}