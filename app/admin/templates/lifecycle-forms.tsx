'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FieldError, FormAlert, FormRow, SubmitButton } from '@/components/admin/form-ui';
import {
  cloneVersionAction,
  createTemplateAction,
  markReadyAction,
  publishVersionAction,
  transitionVersionAction,
  validateVersionAction,
} from './actions';

export interface ProgrammeOption {
  id: string;
  name: string;
  code: string;
}

export function CreateTemplateForm({ programmes }: { programmes: ProgrammeOption[] }) {
  const [state, action] = useActionState(createTemplateAction, null);
  const [programmeId, setProgrammeId] = React.useState<string | null>(
    programmes[0]?.id ?? null
  );

  return (
    <form action={action} className="space-y-3">
      <FormAlert state={state} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[240px_1fr]">
        <FormRow label="Programme">
          <Select
            name="programmeId"
            value={programmeId}
            onValueChange={(next) => setProgrammeId(next)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a programme" />
            </SelectTrigger>
            <SelectContent>
              {programmes.map((programme) => (
                <SelectItem key={programme.id} value={programme.id}>
                  {programme.code} — {programme.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError state={state} name="programmeId" />
        </FormRow>
        <FormRow label="Template title">
          <Input name="title" required placeholder="e.g. ICT Technician Level 6 Mentoring Tool" />
          <FieldError state={state} name="title" />
        </FormRow>
      </div>
      <FormRow label="Description" hint="Optional.">
        <Textarea name="description" rows={2} />
      </FormRow>
      <SubmitButton size="sm" pendingLabel="Creating…">
        Create template
      </SubmitButton>
    </form>
  );
}

export function ValidateForm({ templateId, versionId }: { templateId: string; versionId: string }) {
  const [state, action] = useActionState(validateVersionAction, null);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="templateId" value={templateId} />
      <input type="hidden" name="versionId" value={versionId} />
      <FormAlert state={state} />
      <FormRow label="Validation notes" hint="Optional. Record review decisions.">
        <Textarea name="notes" rows={2} />
      </FormRow>
      <SubmitButton variant="outline" pendingLabel="Validating…">
        Run validation
      </SubmitButton>
    </form>
  );
}

export function MarkReadyForm({ templateId, versionId }: { templateId: string; versionId: string }) {
  const [state, action] = useActionState(markReadyAction, null);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="templateId" value={templateId} />
      <input type="hidden" name="versionId" value={versionId} />
      <FormAlert state={state} />
      <FormRow label="Validation notes" hint="Optional.">
        <Textarea name="notes" rows={2} />
      </FormRow>
      <SubmitButton pendingLabel="Validating…">
        Mark ready for publication
      </SubmitButton>
    </form>
  );
}

export function PublishForm({ templateId, versionId }: { templateId: string; versionId: string }) {
  const [state, action] = useActionState(publishVersionAction, null);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="templateId" value={templateId} />
      <input type="hidden" name="versionId" value={versionId} />
      <FormAlert state={state} />
      <SubmitButton pendingLabel="Publishing…">Publish version</SubmitButton>
    </form>
  );
}

export function CloneForm({
  templateId,
  sourceVersionId,
  label = 'New draft from this version',
}: {
  templateId: string;
  sourceVersionId: string;
  label?: string;
}) {
  const [state, action] = useActionState(cloneVersionAction, null);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="templateId" value={templateId} />
      <input type="hidden" name="sourceVersionId" value={sourceVersionId} />
      <FormAlert state={state} />
      <SubmitButton variant="outline" pendingLabel="Copying…">
        {label}
      </SubmitButton>
    </form>
  );
}

export function TransitionForm({
  templateId,
  versionId,
  to,
  label,
  variant = 'outline',
}: {
  templateId: string;
  versionId: string;
  to: string;
  label: string;
  variant?: 'default' | 'outline';
}) {
  const [state, action] = useActionState(transitionVersionAction, null);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="templateId" value={templateId} />
      <input type="hidden" name="versionId" value={versionId} />
      <input type="hidden" name="to" value={to} />
      <FormAlert state={state} />
      <SubmitButton variant={variant} size="sm" pendingLabel="Applying…">
        {label}
      </SubmitButton>
    </form>
  );
}
