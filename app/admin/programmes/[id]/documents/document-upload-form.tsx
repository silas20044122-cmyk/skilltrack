'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldError, FormAlert, FormRow } from '@/components/admin/form-ui';
import {
  createSourceDocumentUploadTargetAction,
  finalizeSourceDocumentUploadAction,
} from '@/app/admin/documents/actions';
import { getBrowserSupabase, sha256Hex } from '@/lib/supabase/browser';
import type { ActionResult } from '@/lib/actions/result';

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

/**
 * Uploads a mentoring-tool PDF straight from the browser to Supabase Storage
 * via a server-issued signed target, then finalizes the record. This keeps large
 * files off the serverless request path (Vercel caps function bodies at ~4.5 MB).
 */
export function DocumentUploadForm({ programmeId }: { programmeId: string }) {
  const [state, setState] = React.useState<ActionResult | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = formRef.current?.querySelector<HTMLInputElement>('input[type="file"]')?.files?.[0];

    setState(null);

    if (!file) {
      setState({ ok: false, error: 'Select a PDF file to upload.', code: 'VALIDATION' });
      return;
    }
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setState({ ok: false, error: 'Only PDF documents can be uploaded.', code: 'VALIDATION' });
      return;
    }
    if (file.size === 0) {
      setState({ ok: false, error: 'The selected file is empty.', code: 'VALIDATION' });
      return;
    }
    if (file.size > MAX_BYTES) {
      setState({ ok: false, error: 'The PDF exceeds the 25 MB upload limit.', code: 'VALIDATION' });
      return;
    }

    setBusy(true);
    try {
      const targetForm = new FormData();
      targetForm.set('programmeId', programmeId);
      targetForm.set('fileName', file.name);
      targetForm.set('mimeType', file.type || 'application/pdf');
      targetForm.set('size', String(file.size));

      setStatus('Preparing upload…');
      const targetResult = await createSourceDocumentUploadTargetAction(targetForm);
      if (!targetResult.ok) {
        setState(targetResult);
        return;
      }
      const { storageKey, token, bucket } = targetResult.data!;

      setStatus('Uploading PDF…');
      const fileHash = await sha256Hex(file);
      const supabase = getBrowserSupabase();
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .uploadToSignedUrl(storageKey, token, file, {
          contentType: file.type || 'application/pdf',
        });
      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      setStatus('Finalizing…');
      const finalizeForm = new FormData();
      finalizeForm.set('programmeId', programmeId);
      finalizeForm.set('fileName', file.name);
      finalizeForm.set('mimeType', file.type || 'application/pdf');
      finalizeForm.set('size', String(file.size));
      finalizeForm.set('storageKey', storageKey);
      finalizeForm.set('fileHash', fileHash);

      const finalResult = await finalizeSourceDocumentUploadAction(finalizeForm);
      setState(finalResult);
      if (finalResult.ok) {
        formRef.current?.reset();
      }
    } catch (error) {
      setState({
        ok: false,
        error: error instanceof Error ? error.message : 'Upload failed. Please try again.',
        code: 'UNKNOWN',
      });
    } finally {
      setStatus(null);
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <FormAlert state={state} />

      <FormRow
        label="Mentoring-tool PDF"
        htmlFor="file"
        hint="PDF only, up to 25 MB. The file is uploaded directly to private storage and streamed back through an authorized route."
      >
        <Input
          id="file"
          name="file"
          type="file"
          accept="application/pdf,.pdf"
          required
          disabled={busy}
        />
        <FieldError state={state} name="file" />
      </FormRow>

      <Button type="submit" disabled={busy}>
        {busy ? status ?? 'Uploading…' : 'Upload document'}
      </Button>
    </form>
  );
}
