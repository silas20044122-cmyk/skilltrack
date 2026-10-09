'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormAlert, SubmitButton } from '@/components/admin/form-ui';
import { runExtractionAction } from './actions';

export function ExtractionButton({
  documentId,
  status,
  label = 'Run extraction',
  pendingLabel = 'Starting…',
  variant = 'default',
  className,
}: {
  documentId: string;
  status?: string;
  label?: string;
  pendingLabel?: string;
  variant?: 'default' | 'outline' | 'destructive';
  className?: string;
}) {
  const [state, formAction] = useActionState(runExtractionAction, null);
  const router = useRouter();

  const processing = status === 'PROCESSING';

  // While extraction runs detached on the server, re-render the route so the
  // status badge, runs table and versions list stay current.
  useEffect(() => {
    if (!processing) return;
    const timer = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(timer);
  }, [processing, router]);

  // Pull the fresh PROCESSING status immediately after the action returns.
  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={formAction} className={className}>
      <input type="hidden" name="documentId" value={documentId} />
      <SubmitButton
        variant={variant}
        size="sm"
        className="h-7 px-2.5 text-xs"
        pendingLabel={pendingLabel}
        {...(processing ? { disabled: true } : {})}
      >
        {processing ? 'Extracting…' : label}
      </SubmitButton>
      {state && !state.ok ? (
        <div className="mt-1.5">
          <FormAlert state={state} />
        </div>
      ) : null}
    </form>
  );
}
