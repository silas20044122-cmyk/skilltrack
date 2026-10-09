import { prisma } from '@/lib/db/prisma';
import { AppError } from '@/lib/errors';
import { logAuditEvent } from '@/lib/audit/log-audit-event';
import type {
  AssignmentCreateInput,
  AssignmentUpdateInput,
} from '@/lib/validation/schemas';

/**
 * Mentor-trainee assignment domain services.
 *
 * The assignment is a first-class relationship (not a `mentor_id` column on the
 * trainee), so it can carry status, dates, notes and the assigning actor.
 */

const assignmentInclude = {
  mentor: {
    select: {
      id: true,
      name: true,
      email: true,
      mentorProfile: { select: { companyName: true, jobTitle: true } },
    },
  },
  trainee: {
    select: {
      id: true,
      name: true,
      email: true,
      traineeProfile: {
        select: {
          registrationNumber: true,
          programme: { select: { name: true, code: true } },
        },
      },
    },
  },
  assignedBy: { select: { id: true, name: true } },
} as const;

export async function listAssignments() {
  return prisma.mentorAssignment.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: assignmentInclude,
  });
}

export async function getAssignment(id: string) {
  return prisma.mentorAssignment.findUnique({ where: { id }, include: assignmentInclude });
}

async function hasRole(userId: string, code: 'MENTOR' | 'TRAINEE') {
  const record = await prisma.user.findFirst({
    where: { id: userId, userRoles: { some: { role: { code } } } },
    select: { id: true },
  });
  return record !== null;
}

export async function createAssignment(input: AssignmentCreateInput, actorId: string) {
  if (input.mentorId === input.traineeId) {
    throw new AppError('A user cannot be assigned as their own mentor.', 'INVALID_STATE');
  }

  const [mentorOk, traineeOk] = await Promise.all([
    hasRole(input.mentorId, 'MENTOR'),
    hasRole(input.traineeId, 'TRAINEE'),
  ]);
  if (!mentorOk) {
    throw new AppError('The selected mentor is not a mentor account.', 'INVALID_REFERENCE', {
      mentorId: ['Select a valid mentor.'],
    });
  }
  if (!traineeOk) {
    throw new AppError('The selected trainee is not a trainee account.', 'INVALID_REFERENCE', {
      traineeId: ['Select a valid trainee.'],
    });
  }

  const duplicate = await prisma.mentorAssignment.findFirst({
    where: { mentorId: input.mentorId, traineeId: input.traineeId, status: 'ACTIVE' },
    select: { id: true },
  });
  if (duplicate) {
    throw new AppError(
      'An active assignment already exists for this mentor and trainee.',
      'CONFLICT'
    );
  }

  const assignment = await prisma.mentorAssignment.create({
    data: {
      mentorId: input.mentorId,
      traineeId: input.traineeId,
      assignedById: actorId,
      notes: input.notes ?? null,
      startDate: input.startDate ?? new Date(),
      status: 'ACTIVE',
    },
  });

  logAuditEvent({
    action: 'ASSIGNMENT_CREATE',
    actorId,
    targetType: 'MentorAssignment',
    targetId: assignment.id,
    metadata: { mentorId: input.mentorId, traineeId: input.traineeId },
  });
  return assignment;
}

export async function updateAssignment(
  id: string,
  input: AssignmentUpdateInput,
  actorId: string
) {
  const existing = await prisma.mentorAssignment.findUnique({ where: { id } });
  if (!existing) throw new AppError('Assignment not found.', 'NOT_FOUND');

  const status = input.status;
  const endDate =
    status === 'ENDED' ? input.endDate ?? existing.endDate ?? new Date() : null;

  const assignment = await prisma.mentorAssignment.update({
    where: { id },
    data: {
      status,
      endDate,
      notes: input.notes ?? null,
    },
  });

  logAuditEvent({
    action: 'ASSIGNMENT_STATUS_CHANGE',
    actorId,
    targetType: 'MentorAssignment',
    targetId: assignment.id,
    metadata: { status },
  });
  return assignment;
}