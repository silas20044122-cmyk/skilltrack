'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { Input } from '@/components/ui/input';
import { FieldError, FormAlert, FormRow, SubmitButton } from '@/components/admin/form-ui';
import { uploadSourceDocumentAction } from '@/app/admin/documents/actions';

export function DocumentUploadForm({ programmeId }: { programmeId: string }) {
  const [state, formAction] = useActionState(uploadSourceDocumentAction, null);
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="programmeId" value={programmeId} />
      <FormAlert state={state} />

      <FormRow
        label="Mentoring-tool PDF"
        htmlFor="file"
        hint="PDF only, up to 25 MB. The file is stored privately and streamed through an authorized route."
      >
        <Input id="file" name="file" type="file" accept="application/pdf,.pdf" required />
        <FieldError state={state} name="file" />
      </FormRow>

      <SubmitButton pendingLabel="Uploading…">Upload document</SubmitButton>
    </form>
  );
}
