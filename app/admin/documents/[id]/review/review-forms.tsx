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
  setSectionMappingAction,
  updateCompetencyRuleAction,
  updateEvaluationItemAction,
  updateSectionAction,
  validateVersionAction,
} from './actions';

const CATEGORIES = ['KNOWLEDGE', 'SKILL', 'ATTITUDE', 'OTHER'] as const;
const RULE_TYPES = [
  'MINIMUM_COUNT',
  'MINIMUM_PERCENTAGE',
  'REQUIRED_ITEMS',
  'COMPOSITE',
  'OTHER',
] as const;
const MAPPING_STATUSES = ['UNMAPPED', 'MAPPED', 'NOT_APPLICABLE'] as const;

interface ItemRow {
  id: string;
  itemNumber: string | null;
  description: string;
  sourceWording: string | null;
  category: string;
  notes: string | null;
}

interface RuleRow {
  id: string;
  ruleType: string;
  minimumCorrect: number | null;
  minimumPercentage: number | null;
  requiredItemNumbers: unknown;
  sourceWording: string;
  notes: string | null;
}

interface SectionRow {
  id: string;
  sectionNumber: string | null;
  title: string;
  description: string | null;
  sectionType: string | null;
  mappingStatus: string;
}

interface UnitOption {
  id: string;
  code: string;
  name: string;
}

export function ItemForm({
  documentId,
  item,
  disabled,
}: {
  documentId: string;
  item: ItemRow;
  disabled: boolean;
}) {
  const [state, action] = useActionState(updateEvaluationItemAction, null);
  const [category, setCategory] = React.useState(item.category);
  const uid = `item-${item.id}`;

  return (
    <form action={action} className="space-y-3 rounded-lg border border-border/70 bg-muted/10 p-3">
      <input type="hidden" name="documentId" value={documentId} />
      <input type="hidden" name="itemId" value={item.id} />
      <FormAlert state={state} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[110px_1fr]">
        <FormRow label="Item no." htmlFor={`${uid}-number`}>
          <Input id={`${uid}-number`} name="itemNumber" defaultValue={item.itemNumber ?? ''} disabled={disabled} />
          <FieldError state={state} name="itemNumber" />
        </FormRow>
        <FormRow label="Description" htmlFor={`${uid}-description`}>
          <Textarea
            id={`${uid}-description`}
            name="description"
            rows={2}
            defaultValue={item.description}
            required
            disabled={disabled}
          />
          <FieldError state={state} name="description" />
        </FormRow>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormRow label="Category" htmlFor={`${uid}-category`}>
          <Select
            name="category"
            value={category}
            onValueChange={(value) => setCategory(value ?? 'OTHER')}
            disabled={disabled}
          >
            <SelectTrigger id={`${uid}-category`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError state={state} name="category" />
        </FormRow>
        <FormRow
          label="Source wording (verbatim)"
          htmlFor={`${uid}-source`}
          hint="Preserved exactly as printed in the PDF."
        >
          <Textarea
            id={`${uid}-source`}
            name="sourceWording"
            rows={2}
            defaultValue={item.sourceWording ?? ''}
            disabled={disabled}
          />
        </FormRow>
      </div>

      <FormRow label="Reviewer notes" htmlFor={`${uid}-notes`}>
        <Input id={`${uid}-notes`} name="notes" defaultValue={item.notes ?? ''} disabled={disabled} />
      </FormRow>

      {!disabled ? (
        <SubmitButton size="sm" variant="outline" className="h-8">
          Save item
        </SubmitButton>
      ) : null}
    </form>
  );
}

export function RuleForm({
  documentId,
  rule,
  disabled,
}: {
  documentId: string;
  rule: RuleRow;
  disabled: boolean;
}) {
  const [state, action] = useActionState(updateCompetencyRuleAction, null);
  const [ruleType, setRuleType] = React.useState(rule.ruleType);
  const required = Array.isArray(rule.requiredItemNumbers)
    ? (rule.requiredItemNumbers as string[]).join(', ')
    : '';

  return (
    <form action={action} className="space-y-3 rounded-lg border border-border/70 bg-muted/10 p-3">
      <input type="hidden" name="documentId" value={documentId} />
      <input type="hidden" name="ruleId" value={rule.id} />
      <FormAlert state={state} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormRow label="Rule type">
          <Select
            name="ruleType"
            value={ruleType}
            onValueChange={(value) => setRuleType(value ?? 'OTHER')}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RULE_TYPES.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormRow>
        <FormRow label="Required items" hint="Comma-separated item numbers, e.g. 8, 10, 11.">
          <Input
            name="requiredItemNumbers"
            defaultValue={required}
            disabled={disabled}
            placeholder="8, 10, 11"
          />
        </FormRow>
        <FormRow label="Minimum correct">
          <Input
            name="minimumCorrect"
            type="number"
            min={0}
            defaultValue={rule.minimumCorrect ?? ''}
            disabled={disabled}
          />
        </FormRow>
        <FormRow label="Minimum percentage">
          <Input
            name="minimumPercentage"
            type="number"
            min={0}
            max={100}
            defaultValue={rule.minimumPercentage ?? ''}
            disabled={disabled}
          />
        </FormRow>
      </div>

      <FormRow label="Rule wording (verbatim)" htmlFor={`rule-${rule.id}-source`}>
        <Textarea
          id={`rule-${rule.id}-source`}
          name="sourceWording"
          rows={2}
          defaultValue={rule.sourceWording}
          required
          disabled={disabled}
        />
        <FieldError state={state} name="sourceWording" />
      </FormRow>

      <FormRow label="Reviewer notes" htmlFor={`rule-${rule.id}-notes`}>
        <Input
          id={`rule-${rule.id}-notes`}
          name="notes"
          defaultValue={rule.notes ?? ''}
          disabled={disabled}
        />
      </FormRow>

      {!disabled ? (
        <SubmitButton size="sm" variant="outline" className="h-8">
          Save rule
        </SubmitButton>
      ) : null}
    </form>
  );
}

export function SectionForm({
  documentId,
  section,
  disabled,
}: {
  documentId: string;
  section: SectionRow;
  disabled: boolean;
}) {
  const [state, action] = useActionState(updateSectionAction, null);
  const [mappingStatus, setMappingStatus] = React.useState(section.mappingStatus);
  const uid = `section-${section.id}`;

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="documentId" value={documentId} />
      <input type="hidden" name="sectionId" value={section.id} />
      <FormAlert state={state} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[110px_1fr_150px]">
        <FormRow label="Number" htmlFor={`${uid}-number`}>
          <Input
            id={`${uid}-number`}
            name="sectionNumber"
            defaultValue={section.sectionNumber ?? ''}
            disabled={disabled}
          />
        </FormRow>
        <FormRow label="Title" htmlFor={`${uid}-title`}>
          <Input id={`${uid}-title`} name="title" defaultValue={section.title} required disabled={disabled} />
          <FieldError state={state} name="title" />
        </FormRow>
        <FormRow label="Type" htmlFor={`${uid}-type`} hint="Optional">
          <Input
            id={`${uid}-type`}
            name="sectionType"
            defaultValue={section.sectionType ?? ''}
            disabled={disabled}
          />
        </FormRow>
      </div>

      <FormRow label="Description" htmlFor={`${uid}-description`}>
        <Textarea
          id={`${uid}-description`}
          name="description"
          rows={2}
          defaultValue={section.description ?? ''}
          disabled={disabled}
        />
      </FormRow>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[200px_1fr] sm:items-end">
        <FormRow label="Mapping status">
          <Select
            name="mappingStatus"
            value={mappingStatus}
            onValueChange={(value) => setMappingStatus(value ?? 'UNMAPPED')}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MAPPING_STATUSES.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormRow>
        {!disabled ? (
          <SubmitButton size="sm" variant="outline" className="h-8 w-fit">
            Save section
          </SubmitButton>
        ) : null}
      </div>
    </form>
  );
}

export function MappingForm({
  documentId,
  sectionId,
  mappingStatus,
  units,
  selectedUnitIds,
  disabled,
}: {
  documentId: string;
  sectionId: string;
  mappingStatus: string;
  units: UnitOption[];
  selectedUnitIds: string[];
  disabled: boolean;
}) {
  const [state, action] = useActionState(setSectionMappingAction, null);
  const [status, setStatus] = React.useState(mappingStatus);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="documentId" value={documentId} />
      <input type="hidden" name="sectionId" value={sectionId} />
      <FormAlert state={state} />

      {units.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No curriculum units exist for this programme yet. Add units first, then map this section.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {units.map((unit) => (
            <label
              key={unit.id}
              className="flex items-center gap-2 rounded-md border border-border/70 px-2.5 py-1.5 text-sm"
            >
              <input
                type="checkbox"
                name="unitIds"
                value={unit.id}
                defaultChecked={selectedUnitIds.includes(unit.id)}
                disabled={disabled}
                className="h-4 w-4"
              />
              <span className="font-mono text-xs text-muted-foreground">{unit.code}</span>
              <span className="text-foreground">{unit.name}</span>
            </label>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[200px_1fr] sm:items-end">
        <FormRow label="Mapping status">
          <Select name="mappingStatus" value={status} onValueChange={(value) => setStatus(value ?? 'UNMAPPED')} disabled={disabled}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MAPPING_STATUSES.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormRow>
        {!disabled ? (
          <SubmitButton size="sm" variant="outline" className="h-8 w-fit">
            Save mapping
          </SubmitButton>
        ) : null}
      </div>
    </form>
  );
}

export function ValidateForm({
  documentId,
  versionId,
}: {
  documentId: string;
  versionId: string;
}) {
  const [state, action] = useActionState(validateVersionAction, null);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="documentId" value={documentId} />
      <input type="hidden" name="versionId" value={versionId} />
      <FormAlert state={state} />
      <FormRow
        label="Validation notes"
        htmlFor="validation-notes"
        hint="Optional. Record any decisions made while reviewing."
      >
        <Textarea id="validation-notes" name="notes" rows={2} />
      </FormRow>
      <SubmitButton pendingLabel="Validating…">Validate template version</SubmitButton>
    </form>
  );
}
