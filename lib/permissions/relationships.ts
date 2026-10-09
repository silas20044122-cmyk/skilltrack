import { prisma } from '@/lib/db/prisma';

/**
 * Database-backed relationship checks complementing the pure policy helpers in
 * `lib/permissions/rbac.ts`.
 *
 * A MENTOR only gains access to a TRAINEE through an ACTIVE MentorAssignment.
 */

export async function isMentorAssignedTo(
  mentorUserId: string,
  traineeUserId: string
): Promise<boolean> {
  const assignment = await prisma.mentorAssignment.findFirst({
    where: { mentorId: mentorUserId, traineeId: traineeUserId, status: 'ACTIVE' },
    select: { id: true },
  });
  return assignment !== null;
}

export async function getAssignedTraineeIds(mentorUserId: string): Promise<string[]> {
  const assignments = await prisma.mentorAssignment.findMany({
    where: { mentorId: mentorUserId, status: 'ACTIVE' },
    select: { traineeId: true },
  });
  return assignments.map((a) => a.traineeId);
}

export async function getAssignedMentorIds(traineeUserId: string): Promise<string[]> {
  const assignments = await prisma.mentorAssignment.findMany({
    where: { traineeId: traineeUserId, status: 'ACTIVE' },
    select: { mentorId: true },
  });
  return assignments.map((a) => a.mentorId);
}