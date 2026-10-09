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
import { ConfirmSubmit } from '@/components/admin/confirm-submit';
import {
  createCompetencyRuleAction,
  createEvaluationItemAction,
  createSectionAction,
  deleteCompetencyRuleAction,
  deleteEvaluationItemAction,
  deleteSectionAction,
  setSectionMappingAction,
  updateCompetencyRuleAction,
  updateEvaluationItemAction,
  updateSectionAction,
} from '@/app/admin/templates/actions';

const CATEGORIES = ['KNOWLEDGE', 'SKILL', 'ATTITUDE', 'OTHER'] as const;
const RULE_TYPES = [
  'MINIMUM_COUNT',
  'MINIMUM_PERCENTAGE',
  'REQUIRED_ITEMS',
  'COMPOSITE',
  'OTHER',
] as const;
const MAPPING_STATUSES = ['UNMAPPED', 'MAPPED', 'NOT_APPLICABLE'] as const;

export interface EditorItem {
  id: string;
  itemNumber: string | null;
  description: string;
  sourceWording: string | null;
  category: string;
  notes: string | null;
}

export interface EditorRule {
  id: string;
  ruleType: string;
  minimumCorrect: number | null;
  minimumPercentage: number | null;
  requiredItemNumbers: unknown;
  sourceWording: string;
  notes: string | null;
}

export interface EditorSection {
  id: string;
  parentSectionId: string | null;
  sectionNumber: string | null;
  title: string;
  description: string | null;
  sectionType: string | null;
  mappingStatus: string;
  evaluationItems: EditorItem[];
  competencyRules: EditorRule[];
  curriculumUnitLinks: { curriculumUnitId: string }[];
}

export interface EditorUnit {
  id: string;
  code: string;
  name: string;
}

function rulesText(required: unknown): string {
  return Array.isArray(required) ? (required as string[]).join(', ') : '';
}

function ItemForm({
  templateId,
  item,
  disabled,
}: {
  templateId: string;
  item: EditorItem;
  disabled: boolean;
}) {
  const [state, action] = useActionState(updateEvaluationItemAction, null);
  const [category, setCategory] = React.useState(item.category);
  const uid = `item-${item.id}`;

  return (
    <form action={action} className="space-y-3 rounded-lg border border-border/70 bg-muted/10 p-3">
      <input type="hidden" name="templateId" value={templateId} />
      <input type="hidden" name="itemId" value={item.id} />
      <FormAlert state={state} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[110px_1fr]">
        <FormRow label="Item no." htmlFor={`${uid}-number`}>
          <Input id={`${uid}-number`} name="itemNumber" defaultValue={item.itemNumber ?? ''} disabled={disabled} />
          <FieldError state={state} name="itemNumber" />
        </FormRow>
        <FormRow label="Description" htmlFor={`${uid}-description`}>
          <Textarea id={`${uid}-description`} name="description" rows={2} defaultValue={item.description} required disabled={disabled} />
          <FieldError state={state} name="description" />
        </FormRow>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormRow label="Category">
          <Select name="category" value={category} onValueChange={(v) => setCategory(v ?? 'OTHER')} disabled={disabled}>
            <SelectTrigger>
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
        </FormRow>
        <FormRow label="Source wording (verbatim)">
          <Textarea name="sourceWording" rows={2} defaultValue={item.sourceWording ?? ''} disabled={disabled} />
        </FormRow>
      </div>
      <FormRow label="Reviewer notes">
        <Input name="notes" defaultValue={item.notes ?? ''} disabled={disabled} />
      </FormRow>
      {!disabled ? (
        <div className="flex items-center gap-2">
          <SubmitButton size="sm" variant="outline" className="h-8">
            Save item
          </SubmitButton>
          <ConfirmSubmit
            action={deleteEvaluationItemAction}
            fields={{ templateId, itemId: item.id }}
            triggerLabel="Delete"
            title="Delete this evaluation item?"
            description="This removes the item from the draft template."
            confirmLabel="Delete item"
            variant="destructive"
          />
        </div>
      ) : null}
    </form>
  );
}

function RuleForm({
  templateId,
  rule,
  disabled,
}: {
  templateId: string;
  rule: EditorRule;
  disabled: boolean;
}) {
  const [state, action] = useActionState(updateCompetencyRuleAction, null);
  const [ruleType, setRuleType] = React.useState(rule.ruleType);

  return (
    <form action={action} className="space-y-3 rounded-lg border border-border/70 bg-muted/10 p-3">
      <input type="hidden" name="templateId" value={templateId} />
      <input type="hidden" name="ruleId" value={rule.id} />
      <FormAlert state={state} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormRow label="Rule type">
          <Select name="ruleType" value={ruleType} onValueChange={(v) => setRuleType(v ?? 'OTHER')} disabled={disabled}>
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
        <FormRow label="Required items" hint="Comma-separated item numbers.">
          <Input name="requiredItemNumbers" defaultValue={rulesText(rule.requiredItemNumbers)} disabled={disabled} placeholder="8, 10, 11" />
        </FormRow>
        <FormRow label="Minimum correct">
          <Input name="minimumCorrect" type="number" min={0} defaultValue={rule.minimumCorrect ?? ''} disabled={disabled} />
        </FormRow>
        <FormRow label="Minimum percentage">
          <Input name="minimumPercentage" type="number" min={0} max={100} defaultValue={rule.minimumPercentage ?? ''} disabled={disabled} />
        </FormRow>
      </div>
      <FormRow label="Rule wording (verbatim)">
        <Textarea name="sourceWording" rows={2} defaultValue={rule.sourceWording} required disabled={disabled} />
        <FieldError state={state} name="sourceWording" />
      </FormRow>
      <FormRow label="Reviewer notes">
        <Input name="notes" defaultValue={rule.notes ?? ''} disabled={disabled} />
      </FormRow>
      {!disabled ? (
        <div className="flex items-center gap-2">
          <SubmitButton size="sm" variant="outline" className="h-8">
            Save rule
          </SubmitButton>
          <ConfirmSubmit
            action={deleteCompetencyRuleAction}
            fields={{ templateId, ruleId: rule.id }}
            triggerLabel="Delete"
            title="Delete this competency rule?"
            description="This removes the rule from the draft template."
            confirmLabel="Delete rule"
            variant="destructive"
          />
        </div>
      ) : null}
    </form>
  );
}

function AddItemForm({ templateId, sectionId }: { templateId: string; sectionId: string }) {
  const [state, action] = useActionState(createEvaluationItemAction, null);
  const [category, setCategory] = React.useState<string>('SKILL');
  const [open, setOpen] = React.useState(false);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs font-medium text-primary hover:underline">
        + Add evaluation item
      </button>
    );
  }
  return (
    <form action={action} className="space-y-3 rounded-lg border border-dashed border-border p-3">
      <input type="hidden" name="templateId" value={templateId} />
      <input type="hidden" name="sectionId" value={sectionId} />
      <FormAlert state={state} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[110px_1fr]">
        <FormRow label="Item no.">
          <Input name="itemNumber" placeholder="e.g. 1" />
        </FormRow>
        <FormRow label="Description">
          <Textarea name="description" rows={2} required />
          <FieldError state={state} name="description" />
        </FormRow>
      </div>
      <FormRow label="Category">
        <Select name="category" value={category} onValueChange={(v) => setCategory(v ?? 'OTHER')}>
          <SelectTrigger>
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
      </FormRow>
      <div className="flex items-center gap-2">
        <SubmitButton size="sm">Add item</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:underline">
          Cancel
        </button>
      </div>
    </form>
  );
}

function AddRuleForm({ templateId, versionId, sectionId }: { templateId: string; versionId: string; sectionId?: string }) {
  const [state, action] = useActionState(createCompetencyRuleAction, null);
  const [ruleType, setRuleType] = React.useState<string>('MINIMUM_COUNT');
  const [open, setOpen] = React.useState(false);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs font-medium text-primary hover:underline">
        + Add competency rule
      </button>
    );
  }
  return (
    <form action={action} className="space-y-3 rounded-lg border border-dashed border-border p-3">
      <input type="hidden" name="templateId" value={templateId} />
      <input type="hidden" name="versionId" value={versionId} />
      {sectionId ? <input type="hidden" name="sectionId" value={sectionId} /> : null}
      <FormAlert state={state} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormRow label="Rule type">
          <Select name="ruleType" value={ruleType} onValueChange={(v) => setRuleType(v ?? 'OTHER')}>
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
        <FormRow label="Required items" hint="Comma-separated item numbers.">
          <Input name="requiredItemNumbers" placeholder="8, 10, 11" />
        </FormRow>
        <FormRow label="Minimum correct">
          <Input name="minimumCorrect" type="number" min={0} />
        </FormRow>
        <FormRow label="Minimum percentage">
          <Input name="minimumPercentage" type="number" min={0} max={100} />
        </FormRow>
      </div>
      <FormRow label="Rule wording (verbatim)">
        <Textarea name="sourceWording" rows={2} required />
        <FieldError state={state} name="sourceWording" />
      </FormRow>
      <div className="flex items-center gap-2">
        <SubmitButton size="sm">Add rule</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:underline">
          Cancel
        </button>
      </div>
    </form>
  );
}

function MappingForm({
  templateId,
  section,
  units,
  disabled,
}: {
  templateId: string;
  section: EditorSection;
  units: EditorUnit[];
  disabled: boolean;
}) {
  const [state, action] = useActionState(setSectionMappingAction, null);
  const [status, setStatus] = React.useState(section.mappingStatus);
  const selected = section.curriculumUnitLinks.map((l) => l.curriculumUnitId);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="templateId" value={templateId} />
      <input type="hidden" name="sectionId" value={section.id} />
      <FormAlert state={state} />
      {units.length === 0 ? (
        <p className="text-xs text-muted-foreground">No curriculum units exist for this programme yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {units.map((unit) => (
            <label key={unit.id} className="flex items-center gap-2 rounded-md border border-border/70 px-2.5 py-1.5 text-sm">
              <input type="checkbox" name="unitIds" value={unit.id} defaultChecked={selected.includes(unit.id)} disabled={disabled} className="h-4 w-4" />
              <span className="font-mono text-xs text-muted-foreground">{unit.code}</span>
              <span className="text-foreground">{unit.name}</span>
            </label>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[200px_1fr] sm:items-end">
        <FormRow label="Mapping status">
          <Select name="mappingStatus" value={status} onValueChange={(v) => setStatus(v ?? 'UNMAPPED')} disabled={disabled}>
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

function SectionForm({
  templateId,
  section,
  sections,
  disabled,
}: {
  templateId: string;
  section: EditorSection;
  sections: EditorSection[];
  disabled: boolean;
}) {
  const [state, action] = useActionState(updateSectionAction, null);
  const [mappingStatus, setMappingStatus] = React.useState(section.mappingStatus);
  const uid = `section-${section.id}`;

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="templateId" value={templateId} />
      <input type="hidden" name="sectionId" value={section.id} />
      <FormAlert state={state} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[110px_1fr_150px]">
        <FormRow label="Number" htmlFor={`${uid}-number`}>
          <Input id={`${uid}-number`} name="sectionNumber" defaultValue={section.sectionNumber ?? ''} disabled={disabled} />
        </FormRow>
        <FormRow label="Title" htmlFor={`${uid}-title`}>
          <Input id={`${uid}-title`} name="title" defaultValue={section.title} required disabled={disabled} />
          <FieldError state={state} name="title" />
        </FormRow>
        <FormRow label="Type" htmlFor={`${uid}-type`}>
          <Input id={`${uid}-type`} name="sectionType" defaultValue={section.sectionType ?? ''} disabled={disabled} />
        </FormRow>
      </div>
      <FormRow label="Description" htmlFor={`${uid}-description`}>
        <Textarea id={`${uid}-description`} name="description" rows={2} defaultValue={section.description ?? ''} disabled={disabled} />
      </FormRow>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[200px_1fr] sm:items-end">
        <FormRow label="Mapping status">
          <Select name="mappingStatus" value={mappingStatus} onValueChange={(v) => setMappingStatus(v ?? 'UNMAPPED')} disabled={disabled}>
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
          <div className="flex items-center gap-2">
            <SubmitButton size="sm" variant="outline" className="h-8 w-fit">
              Save section
            </SubmitButton>
            <ConfirmSubmit
              action={deleteSectionAction}
              fields={{ templateId, sectionId: section.id }}
              triggerLabel="Delete section"
              title="Delete this section?"
              description="The section and its child sections, items and rules are removed from the draft."
              confirmLabel="Delete section"
              variant="destructive"
            />
          </div>
        ) : null}
      </div>
      {!disabled ? (
        <p className="text-xs text-muted-foreground">
          Parent section: {sections.find((s) => s.id === section.parentSectionId)?.title ?? '— (top level)'}
        </p>
      ) : null}
    </form>
  );
}

function SectionPanel({
  templateId,
  versionId,
  section,
  sections,
  units,
  editable,
}: {
  templateId: string;
  versionId: string;
  section: EditorSection;
  sections: EditorSection[];
  units: EditorUnit[];
  editable: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <SectionForm templateId={templateId} section={section} sections={sections} disabled={!editable} />

      <div className="mt-4 space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Evaluation items</h3>
        {section.evaluationItems.map((item) => (
          <ItemForm key={item.id} templateId={templateId} item={item} disabled={!editable} />
        ))}
        {editable ? <AddItemForm templateId={templateId} sectionId={section.id} /> : null}
      </div>

      <div className="mt-4 space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Competency rules</h3>
        {section.competencyRules.map((rule) => (
          <RuleForm key={rule.id} templateId={templateId} rule={rule} disabled={!editable} />
        ))}
        {editable ? <AddRuleForm templateId={templateId} versionId={versionId} sectionId={section.id} /> : null}
      </div>

      <div className="mt-4 space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Curriculum mapping</h3>
        <MappingForm templateId={templateId} section={section} units={units} disabled={!editable} />
      </div>
    </div>
  );
}

export function VersionEditor({
  templateId,
  versionId,
  sections,
  versionLevelRules,
  units,
  editable,
}: {
  templateId: string;
  versionId: string;
  sections: EditorSection[];
  versionLevelRules: EditorRule[];
  units: EditorUnit[];
  editable: boolean;
}) {
  const [addState, addAction] = useActionState(createSectionAction, null);
  const [active, setActive] = React.useState<string>(sections[0]?.id ?? 'version');

  const activeSection = sections.find((s) => s.id === active);
  const effective = activeSection
    ? active
    : active === 'version' || active === 'add'
      ? active
      : sections[0]?.id ?? 'version';

  const tabClass = (selected: boolean) =>
    [
      'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
      selected
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
    ].join(' ');

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Template sections" className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/20 p-1">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            role="tab"
            aria-selected={effective === section.id}
            onClick={() => setActive(section.id)}
            className={tabClass(effective === section.id)}
          >
            {section.sectionNumber ? (
              <span className="mr-1.5 font-mono text-xs opacity-70">{section.sectionNumber}</span>
            ) : null}
            {section.title}
            <span className="ml-2 text-xs opacity-70">{section.evaluationItems.length}</span>
          </button>
        ))}
        <button
          type="button"
          role="tab"
          aria-selected={effective === 'version'}
          onClick={() => setActive('version')}
          className={tabClass(effective === 'version')}
        >
          Version rules
          <span className="ml-2 text-xs opacity-70">{versionLevelRules.length}</span>
        </button>
        {editable ? (
          <button
            type="button"
            role="tab"
            aria-selected={effective === 'add'}
            onClick={() => setActive('add')}
            className={tabClass(effective === 'add')}
          >
            + Add section
          </button>
        ) : null}
      </div>

      <div role="tabpanel">
        {activeSection ? (
          <SectionPanel templateId={templateId} versionId={versionId} section={activeSection} sections={sections} units={units} editable={editable} />
        ) : effective === 'version' ? (
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Version-level competency rules</h2>
            <div className="space-y-2">
              {versionLevelRules.map((rule) => (
                <RuleForm key={rule.id} templateId={templateId} rule={rule} disabled={!editable} />
              ))}
              {editable ? <AddRuleForm templateId={templateId} versionId={versionId} /> : null}
            </div>
            {versionLevelRules.length === 0 && !editable ? (
              <p className="text-xs text-muted-foreground">No version-level rules.</p>
            ) : null}
          </div>
        ) : editable ? (
          <div className="rounded-xl border border-dashed border-border p-4 sm:p-5">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Add a section</h2>
            <form action={addAction} className="space-y-3">
              <input type="hidden" name="templateId" value={templateId} />
              <input type="hidden" name="versionId" value={versionId} />
              <FormAlert state={addState} />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[110px_1fr_200px]">
                <FormRow label="Number">
                  <Input name="sectionNumber" placeholder="e.g. 12" />
                </FormRow>
                <FormRow label="Title">
                  <Input name="title" required />
                  <FieldError state={addState} name="title" />
                </FormRow>
                <FormRow label="Parent section" hint="Leave empty for a top-level section.">
                  <Select name="parentSectionId">
                    <SelectTrigger>
                      <SelectValue placeholder="Top level" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.sectionNumber ? `${s.sectionNumber} — ` : ''}
                          {s.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormRow>
              </div>
              <SubmitButton size="sm">Add section</SubmitButton>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}
