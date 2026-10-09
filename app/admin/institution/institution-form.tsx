'use client';

import { useActionState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FieldError, FormAlert, FormRow, SubmitButton } from '@/components/admin/form-ui';
import { updateInstitutionAction } from './actions';

interface InstitutionFormProps {
  institution: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
}

export function InstitutionForm({ institution }: InstitutionFormProps) {
  const [state, action] = useActionState(updateInstitutionAction, null);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={institution.id} />
      <FormAlert state={state} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormRow label="Name" htmlFor="name">
          <Input id="name" name="name" defaultValue={institution.name} required />
          <FieldError state={state} name="name" />
        </FormRow>
        <FormRow label="Code" htmlFor="code" hint="Unique short code, e.g. RVNP.">
          <Input id="code" name="code" defaultValue={institution.code} required />
          <FieldError state={state} name="code" />
        </FormRow>
        <FormRow label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" defaultValue={institution.email ?? ''} />
          <FieldError state={state} name="email" />
        </FormRow>
        <FormRow label="Phone" htmlFor="phone">
          <Input id="phone" name="phone" defaultValue={institution.phone ?? ''} />
          <FieldError state={state} name="phone" />
        </FormRow>
      </div>

      <FormRow label="Address" htmlFor="address">
        <Input id="address" name="address" defaultValue={institution.address ?? ''} />
        <FieldError state={state} name="address" />
      </FormRow>

      <FormRow label="Description" htmlFor="description">
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={institution.description ?? ''}
        />
        <FieldError state={state} name="description" />
      </FormRow>

      <SubmitButton>Save institution</SubmitButton>
    </form>
  );
}