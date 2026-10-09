'use client';

import * as React from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FormAlert, SubmitButton } from '@/components/admin/form-ui';
import type { ActionResult } from '@/lib/actions/result';

interface ConfirmSubmitProps {
  action: (state: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  fields: Record<string, string>;
  triggerLabel: string;
  title: string;
  description: string;
  confirmLabel: string;
  variant?: 'default' | 'destructive' | 'outline';
}

/**
 * Two-step confirmation for sensitive/destructive operations (deactivation,
 * ending assignments, etc.). Uses a real dialog rather than window.confirm so
 * the confirmation is accessible and styled consistently.
 */
export function ConfirmSubmit({
  action,
  fields,
  triggerLabel,
  title,
  description,
  confirmLabel,
  variant = 'outline',
}: ConfirmSubmitProps) {
  const [open, setOpen] = React.useState(false);
  const [state, formAction] = React.useActionState(
    async (prev: ActionResult | null, formData: FormData) => {
      const result = await action(prev, formData);
      if (result.ok) setOpen(false);
      return result;
    },
    null
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={
          variant === 'destructive'
            ? 'inline-flex h-7 items-center rounded-md border border-destructive/30 bg-destructive/10 px-2.5 text-xs font-medium text-destructive hover:bg-destructive/20'
            : 'inline-flex h-7 items-center rounded-md border border-border bg-background px-2.5 text-xs font-medium hover:bg-muted'
        }
      >
        {triggerLabel}
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
        <DialogDescription className="mt-1 text-sm text-muted-foreground">
          {description}
        </DialogDescription>
        <form action={formAction} className="mt-4 space-y-3">
          {Object.entries(fields).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
          <FormAlert state={state} />
          <div className="flex justify-end gap-2">
            <DialogClose className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted">
              Cancel
            </DialogClose>
            <SubmitButton variant={variant === 'destructive' ? 'destructive' : 'default'}>
              {confirmLabel}
            </SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}