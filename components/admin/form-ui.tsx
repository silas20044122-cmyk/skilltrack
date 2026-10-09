'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import type { ActionResult } from '@/lib/actions/result';
import { cn } from '@/lib/utils';

export function SubmitButton({
  children,
  pendingLabel = 'Saving…',
  ...props
}: React.ComponentProps<typeof Button> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? pendingLabel : children}
    </Button>
  );
}

export function FormAlert({ state }: { state: ActionResult | null }) {
  if (!state) return null;
  if (state.ok) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
        {state.message ?? 'Saved successfully.'}
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {state.error}
    </div>
  );
}

export function FieldError({
  state,
  name,
}: {
  state: ActionResult | null;
  name: string;
}) {
  if (!state || state.ok) return null;
  const messages = state.fieldErrors?.[name];
  if (!messages || messages.length === 0) return null;
  return <p className="text-xs text-destructive">{messages.join(' ')}</p>;
}

export function FormRow({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}