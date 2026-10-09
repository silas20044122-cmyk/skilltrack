'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FieldError, FormAlert, FormRow, SubmitButton } from '@/components/admin/form-ui';
import { cn } from '@/lib/utils';
import { createUserAction, updateUserAction } from './actions';

const ROLE_OPTIONS = [
  { code: 'ADMIN', label: 'Administrator' },
  { code: 'ILO', label: 'ILO / Supervisor' },
  { code: 'MENTOR', label: 'Mentor' },
  { code: 'TRAINEE', label: 'Trainee' },
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

interface ProgrammeOption {
  id: string;
  name: string;
  code: string;
}

interface CommonProps {
  programmes: ProgrammeOption[];
  institutionId?: string;
}

function StatusSelect({ defaultValue }: { defaultValue: string }) {
  const [value, setValue] = React.useState(defaultValue);
  return (
    <Select name="status" value={value} onValueChange={(next) => setValue(next as string)}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ProgrammeSelect({ programmes, defaultValue }: { programmes: ProgrammeOption[]; defaultValue?: string | null }) {
  const [value, setValue] = React.useState<string | null>(defaultValue ?? null);
  return (
    <Select
      name="programmeId"
      value={value}
      onValueChange={(next) => setValue(next as string | null)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select a programme" />
      </SelectTrigger>
      <SelectContent>
        {programmes.map((programme) => (
          <SelectItem key={programme.id} value={programme.id}>
            {programme.name} ({programme.code})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function UserCreateForm({ programmes, institutionId }: CommonProps) {
  const [state, action] = useActionState(createUserAction, null);
  const [roles, setRoles] = React.useState<string[]>(['TRAINEE']);

  const toggleRole = (code: string) => {
    setRoles((prev) =>
      prev.includes(code) ? prev.filter((r) => r !== code) : [...prev, code]
    );
  };

  return (
    <form action={action} className="space-y-6">
      <FormAlert state={state} />

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Account</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormRow label="Full name" htmlFor="name">
            <Input id="name" name="name" required />
            <FieldError state={state} name="name" />
          </FormRow>
          <FormRow label="Email" htmlFor="email">
            <Input id="email" name="email" type="email" required />
            <FieldError state={state} name="email" />
          </FormRow>
          <FormRow label="Temporary password" htmlFor="password" hint="Minimum 8 characters.">
            <Input id="password" name="password" type="text" required />
            <FieldError state={state} name="password" />
          </FormRow>
          <FormRow label="Status" htmlFor="status">
            <StatusSelect defaultValue="ACTIVE" />
            <FieldError state={state} name="status" />
          </FormRow>
        </div>

        <FormRow label="Roles">
          <div className="flex flex-wrap gap-2">
            {ROLE_OPTIONS.map((role) => {
              const checked = roles.includes(role.code);
              return (
                <label
                  key={role.code}
                  className={cn(
                    'inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm',
                    checked
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border text-muted-foreground'
                  )}
                >
                  <input
                    type="checkbox"
                    name="roles"
                    value={role.code}
                    checked={checked}
                    onChange={() => toggleRole(role.code)}
                    className="accent-primary"
                  />
                  {role.label}
                </label>
              );
            })}
          </div>
          <FieldError state={state} name="roles" />
        </FormRow>
      </section>

      {roles.includes('TRAINEE') ? (
        <section className="space-y-4 rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">Trainee profile</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormRow label="Registration number" htmlFor="registrationNumber">
              <Input id="registrationNumber" name="registrationNumber" />
              <FieldError state={state} name="registrationNumber" />
            </FormRow>
            <FormRow label="Programme" htmlFor="programmeId">
              <ProgrammeSelect programmes={programmes} />
              <FieldError state={state} name="programmeId" />
            </FormRow>
          </div>
        </section>
      ) : null}

      {roles.includes('MENTOR') ? (
        <section className="space-y-4 rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">Mentor profile</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormRow label="Company" htmlFor="companyName">
              <Input id="companyName" name="companyName" />
              <FieldError state={state} name="companyName" />
            </FormRow>
            <FormRow label="Job title" htmlFor="jobTitle">
              <Input id="jobTitle" name="jobTitle" />
              <FieldError state={state} name="jobTitle" />
            </FormRow>
            <FormRow label="Contact email" htmlFor="contactEmail">
              <Input id="contactEmail" name="contactEmail" type="email" />
              <FieldError state={state} name="contactEmail" />
            </FormRow>
            <FormRow label="Phone" htmlFor="phone">
              <Input id="phone" name="phone" />
              <FieldError state={state} name="phone" />
            </FormRow>
          </div>
        </section>
      ) : null}

      {roles.includes('ILO') ? (
        <section className="space-y-4 rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">ILO profile</h3>
          <input type="hidden" name="institutionId" value={institutionId ?? ''} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormRow label="Designation" htmlFor="designation">
              <Input id="designation" name="designation" />
              <FieldError state={state} name="designation" />
            </FormRow>
            <FormRow label="Office email" htmlFor="officeEmail">
              <Input id="officeEmail" name="officeEmail" type="email" />
              <FieldError state={state} name="officeEmail" />
            </FormRow>
          </div>
        </section>
      ) : null}

      <SubmitButton>Create user</SubmitButton>
    </form>
  );
}

interface UserEditFormProps extends CommonProps {
  user: {
    id: string;
    name: string;
    email: string;
    status: string;
    roles: string[];
    registrationNumber: string | null;
    programmeId: string | null;
    companyName: string | null;
    jobTitle: string | null;
    contactEmail: string | null;
    phone: string | null;
    designation: string | null;
    officeEmail: string | null;
  };
}

export function UserEditForm({ user, programmes, institutionId }: UserEditFormProps) {
  const [state, action] = useActionState(updateUserAction, null);
  const roles = user.roles;

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="id" value={user.id} />
      <FormAlert state={state} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormRow label="Full name" htmlFor="name">
          <Input id="name" name="name" defaultValue={user.name} required />
          <FieldError state={state} name="name" />
        </FormRow>
        <FormRow label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" defaultValue={user.email} required />
          <FieldError state={state} name="email" />
        </FormRow>
        <FormRow label="Status" htmlFor="status">
          <StatusSelect defaultValue={user.status} />
          <FieldError state={state} name="status" />
        </FormRow>
      </div>

      {roles.includes('TRAINEE') ? (
        <section className="space-y-4 rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">Trainee profile</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormRow label="Registration number" htmlFor="registrationNumber">
              <Input
                id="registrationNumber"
                name="registrationNumber"
                defaultValue={user.registrationNumber ?? ''}
              />
              <FieldError state={state} name="registrationNumber" />
            </FormRow>
            <FormRow label="Programme" htmlFor="programmeId">
              <ProgrammeSelect programmes={programmes} defaultValue={user.programmeId} />
              <FieldError state={state} name="programmeId" />
            </FormRow>
          </div>
        </section>
      ) : null}

      {roles.includes('MENTOR') ? (
        <section className="space-y-4 rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">Mentor profile</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormRow label="Company" htmlFor="companyName">
              <Input id="companyName" name="companyName" defaultValue={user.companyName ?? ''} />
              <FieldError state={state} name="companyName" />
            </FormRow>
            <FormRow label="Job title" htmlFor="jobTitle">
              <Input id="jobTitle" name="jobTitle" defaultValue={user.jobTitle ?? ''} />
              <FieldError state={state} name="jobTitle" />
            </FormRow>
            <FormRow label="Contact email" htmlFor="contactEmail">
              <Input
                id="contactEmail"
                name="contactEmail"
                type="email"
                defaultValue={user.contactEmail ?? ''}
              />
              <FieldError state={state} name="contactEmail" />
            </FormRow>
            <FormRow label="Phone" htmlFor="phone">
              <Input id="phone" name="phone" defaultValue={user.phone ?? ''} />
              <FieldError state={state} name="phone" />
            </FormRow>
          </div>
        </section>
      ) : null}

      {roles.includes('ILO') ? (
        <section className="space-y-4 rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">ILO profile</h3>
          <input type="hidden" name="institutionId" value={institutionId ?? ''} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormRow label="Designation" htmlFor="designation">
              <Input id="designation" name="designation" defaultValue={user.designation ?? ''} />
              <FieldError state={state} name="designation" />
            </FormRow>
            <FormRow label="Office email" htmlFor="officeEmail">
              <Input
                id="officeEmail"
                name="officeEmail"
                type="email"
                defaultValue={user.officeEmail ?? ''}
              />
              <FieldError state={state} name="officeEmail" />
            </FormRow>
          </div>
        </section>
      ) : null}

      <SubmitButton>Save changes</SubmitButton>
    </form>
  );
}