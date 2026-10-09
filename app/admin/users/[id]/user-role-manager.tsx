'use client';

import { useActionState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmSubmit } from '@/components/admin/confirm-submit';
import { FieldError, FormAlert, SubmitButton } from '@/components/admin/form-ui';
import { assignRoleAction, removeRoleAction } from '../actions';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrator',
  ILO: 'ILO / Supervisor',
  MENTOR: 'Mentor',
  TRAINEE: 'Trainee',
};

export function UserRoleManager({
  userId,
  roles,
}: {
  userId: string;
  roles: { code: string }[];
}) {
  const [state, action] = useActionState(assignRoleAction, null);
  const assigned = roles.map((r) => r.code);
  const assignable = Object.keys(ROLE_LABELS).filter((code) => !assigned.includes(code));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {roles.map((role) => (
          <div
            key={role.code}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/20 px-2.5 py-1.5"
          >
            <Badge variant="outline" className="font-mono text-[10px]">
              {role.code}
            </Badge>
            <span className="text-xs text-muted-foreground">{ROLE_LABELS[role.code] ?? role.code}</span>
            <ConfirmSubmit
              action={removeRoleAction}
              fields={{ userId, role: role.code }}
              triggerLabel="Remove"
              title={`Remove ${role.code} role?`}
              description="The user's role-specific profile data is retained but becomes inactive. A user must keep at least one role."
              confirmLabel="Remove role"
              variant="destructive"
            />
          </div>
        ))}
      </div>

      {assignable.length === 0 ? (
        <p className="text-sm text-muted-foreground">All roles are assigned.</p>
      ) : (
        <form action={action} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="userId" value={userId} />
          <div className="w-56 space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="role">
              Add role
            </label>
            <Select name="role" defaultValue={assignable[0]}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assignable.map((code) => (
                  <SelectItem key={code} value={code}>
                    {ROLE_LABELS[code]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError state={state} name="role" />
          </div>
          <SubmitButton variant="outline" pendingLabel="Adding…">
            Add role
          </SubmitButton>
        </form>
      )}

      <FormAlert state={state} />
    </div>
  );
}