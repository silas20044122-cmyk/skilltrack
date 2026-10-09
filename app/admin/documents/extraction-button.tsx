'use client';

import { useActionState } from 'react';
import { FormAlert, SubmitButton } from '@/components/admin/form-ui';
import { runExtractionAction } from './actions';

export function ExtractionButton({
  documentId,
  label = 'Run extraction',
  pendingLabel = 'Extracting…',
  variant = 'default',
  className,
}: {
  documentId: string;
  label?: string;
  pendingLabel?: string;
  variant?: 'default' | 'outline' | 'destructive';
  className?: string;
}) {
  const [state, formAction] = useActionState(runExtractionAction, null);

  return (
    <form action={formAction} className={className}>
      <input type="hidden" name="documentId" value={documentId} />
      <SubmitButton variant={variant} size="sm" className="h-7 px-2.5 text-xs" pendingLabel={pendingLabel}>
        {label}
      </SubmitButton>
      {state && !state.ok ? (
        <div className="mt-1.5">
          <FormAlert state={state} />
        </div>
      ) : null}
    </form>
  );
}
