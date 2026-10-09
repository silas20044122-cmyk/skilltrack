'use client';

import { useActionState } from 'react';
import { Input } from '@/components/ui/input';
import { FieldError, FormAlert, FormRow, SubmitButton } from '@/components/admin/form-ui';
import { resetPasswordAction } from '../actions';

export function UserPasswordForm({ userId }: { userId: string }) {
  const [state, action] = useActionState(resetPasswordAction, null);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={userId} />
      <FormAlert state={state} />
      <FormRow
        label="New password"
        htmlFor="password"
        hint="Minimum 8 characters. Share securely with the user."
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input id="password" name="password" type="text" required minLength={8} />
          <SubmitButton pendingLabel="Resetting…">Reset password</SubmitButton>
        </div>
        <FieldError state={state} name="password" />
      </FormRow>
    </form>
  );
}