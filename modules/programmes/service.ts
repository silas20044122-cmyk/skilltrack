import { prisma } from '@/lib/db/prisma';
import { AppError } from '@/lib/errors';
import { logAuditEvent } from '@/lib/audit/log-audit-event';
import type { ProgrammeInput } from '@/lib/validation/schemas';

/**
 * Programme domain services. Programmes belong to a department, which in turn
 * belongs to the institution. `institutionId` is denormalized so programme
 * codes remain unique institution-wide.
 */

export async function listProgrammes() {
  return prisma.programme.findMany({
    orderBy: [{ department: { name: 'asc' } }, { name: 'asc' }],
    include: {
      department: { select: { id: true, name: true, code: true } },
      _count: { select: { trainees: true } },
    },
  });
}

export async function getProgramme(id: string) {
  return prisma.programme.findUnique({
    where: { id },
    include: { department: true },
  });
}

/** Programme options for selectors (active only). */
export async function listProgrammeOptions() {
  return prisma.programme.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, code: true, departmentId: true },
  });
}

async function resolveDepartment(departmentId: string) {
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    select: { id: true, institutionId: true },
  });
  if (!department) {
    throw new AppError('The selected department does not exist.', 'NOT_FOUND', {
      departmentId: ['Select a valid department.'],
    });
  }
  return department;
}

export async function createProgramme(input: ProgrammeInput, actorId: string) {
  const department = await resolveDepartment(input.departmentId);
  const programme = await prisma.programme.create({
    data: {
      institutionId: department.institutionId,
      departmentId: department.id,
      name: input.name,
      code: input.code,
      level: input.level ?? null,
      description: input.description ?? null,
    },
  });
  logAuditEvent({
    action: 'PROGRAMME_CREATE',
    actorId,
    targetType: 'Programme',
    targetId: programme.id,
    metadata: { code: programme.code, departmentId: department.id },
  });
  return programme;
}

export async function updateProgramme(
  id: string,
  input: ProgrammeInput,
  actorId: string
) {
  const department = await resolveDepartment(input.departmentId);
  const programme = await prisma.programme.update({
    where: { id },
    data: {
      institutionId: department.institutionId,
      departmentId: department.id,
      name: input.name,
      code: input.code,
      level: input.level ?? null,
      description: input.description ?? null,
    },
  });
  logAuditEvent({
    action: 'PROGRAMME_UPDATE',
    actorId,
    targetType: 'Programme',
    targetId: programme.id,
  });
  return programme;
}

export async function setProgrammeStatus(
  id: string,
  status: 'ACTIVE' | 'INACTIVE',
  actorId: string
) {
  const programme = await prisma.programme.update({
    where: { id },
    data: { status },
  });
  logAuditEvent({
    action: 'PROGRAMME_UPDATE',
    actorId,
    targetType: 'Programme',
    targetId: programme.id,
    metadata: { status },
  });
  return programme;
}