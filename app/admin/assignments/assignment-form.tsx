'use client';

import { useActionState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FieldError, FormAlert, FormRow, SubmitButton } from '@/components/admin/form-ui';
import { createAssignmentAction } from './actions';

interface MentorOption {
  id: string;
  name: string;
  email: string;
  mentorProfile: { companyName: string | null; jobTitle: string | null } | null;
}

interface TraineeOption {
  id: string;
  name: string;
  email: string;
  traineeProfile: {
    registrationNumber: string | null;
    programme: { name: string; code: string } | null;
  } | null;
}

export function AssignmentForm({
  mentors,
  trainees,
}: {
  mentors: MentorOption[];
  trainees: TraineeOption[];
}) {
  const [state, action] = useActionState(createAssignmentAction, null);

  return (
    <form action={action} className="space-y-4">
      <FormAlert state={state} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormRow label="Mentor" htmlFor="mentorId">
          <Select name="mentorId" defaultValue={null}>
            <SelectTrigger id="mentorId">
              <SelectValue placeholder="Select a mentor" />
            </SelectTrigger>
            <SelectContent>
              {mentors.map((mentor) => (
                <SelectItem key={mentor.id} value={mentor.id}>
                  {mentor.name}
                  {mentor.mentorProfile?.companyName
                    ? ` — ${mentor.mentorProfile.companyName}`
                    : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError state={state} name="mentorId" />
        </FormRow>

        <FormRow label="Trainee" htmlFor="traineeId">
          <Select name="traineeId" defaultValue={null}>
            <SelectTrigger id="traineeId">
              <SelectValue placeholder="Select a trainee" />
            </SelectTrigger>
            <SelectContent>
              {trainees.map((trainee) => (
                <SelectItem key={trainee.id} value={trainee.id}>
                  {trainee.name}
                  {trainee.traineeProfile?.programme
                    ? ` — ${trainee.traineeProfile.programme.code}`
                    : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError state={state} name="traineeId" />
        </FormRow>
      </div>

      <FormRow label="Start date" htmlFor="startDate" hint="Defaults to today if left blank.">
        <input
          id="startDate"
          name="startDate"
          type="date"
          className="flex h-8 w-full max-w-xs rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        />
        <FieldError state={state} name="startDate" />
      </FormRow>

      <FormRow label="Notes" htmlFor="notes">
        <Textarea id="notes" name="notes" rows={3} />
        <FieldError state={state} name="notes" />
      </FormRow>

      <SubmitButton>Create assignment</SubmitButton>
    </form>
  );
}