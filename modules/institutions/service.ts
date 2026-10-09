import { prisma } from '@/lib/db/prisma';
import { AppError } from '@/lib/errors';
import { logAuditEvent } from '@/lib/audit/log-audit-event';
import type { DepartmentInput, InstitutionInput } from '@/lib/validation/schemas';

/**
 * Institution & Department domain services.
 *
 * MVP runs as a single-institution deployment, but the institution entity is
 * preserved in the database so future multi-institution support needs no
 * domain redesign.
 */

export async function getInstitution() {
  return prisma.institution.findFirst({
    orderBy: { createdAt: 'asc' },
  });
}

export async function getInstitutionOrThrow() {
  const institution = await getInstitution();
  if (!institution) {
    throw new AppError(
      'No institution is configured. Seed the database before managing departments.',
      'NOT_FOUND'
    );
  }
  return institution;
}

export async function updateInstitution(
  institutionId: string,
  input: InstitutionInput,
  actorId: string
) {
  const institution = await prisma.institution.update({
    where: { id: institutionId },
    data: {
      name: input.name,
      code: input.code,
      description: input.description ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      address: input.address ?? null,
    },
  });
  logAuditEvent({
    action: 'INSTITUTION_UPDATE',
    actorId,
    targetType: 'Institution',
    targetId: institution.id,
  });
  return institution;
}

export async function listDepartments() {
  return prisma.department.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { programmes: true } },
    },
  });
}

export async function getDepartment(id: string) {
  return prisma.department.findUnique({ where: { id } });
}

export async function createDepartment(input: DepartmentInput, actorId: string) {
  const institution = await getInstitutionOrThrow();
  const department = await prisma.department.create({
    data: {
      institutionId: institution.id,
      name: input.name,
      code: input.code,
      description: input.description ?? null,
    },
  });
  logAuditEvent({
    action: 'DEPARTMENT_CREATE',
    actorId,
    targetType: 'Department',
    targetId: department.id,
    metadata: { code: department.code },
  });
  return department;
}

export async function updateDepartment(
  id: string,
  input: DepartmentInput,
  actorId: string
) {
  const department = await prisma.department.update({
    where: { id },
    data: {
      name: input.name,
      code: input.code,
      description: input.description ?? null,
    },
  });
  logAuditEvent({
    action: 'DEPARTMENT_UPDATE',
    actorId,
    targetType: 'Department',
    targetId: department.id,
    metadata: { code: department.code },
  });
  return department;
}

export async function setDepartmentStatus(
  id: string,
  status: 'ACTIVE' | 'INACTIVE',
  actorId: string
) {
  const department = await prisma.department.update({
    where: { id },
    data: { status },
  });
  logAuditEvent({
    action: 'DEPARTMENT_UPDATE',
    actorId,
    targetType: 'Department',
    targetId: department.id,
    metadata: { status },
  });
  return department;
}