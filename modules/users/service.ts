import type { RoleType } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { AppError } from '@/lib/errors';
import { hashPassword } from '@/lib/auth/password';
import { logAuditEvent } from '@/lib/audit/log-audit-event';
import type { RoleCode } from '@/types/auth';
import type { UserCreateInput, UserUpdateInput } from '@/lib/validation/schemas';

/**
 * User, role and profile domain services.
 *
 * Identity (`User`) is kept separate from role-specific profiles
 * (`TraineeProfile`, `MentorProfile`, `IloProfile`). Role assignment never
 * blindly replaces the full role set.
 */

const userInclude = {
  userRoles: { include: { role: true } },
  traineeProfile: { include: { programme: { select: { id: true, name: true, code: true } } } },
  mentorProfile: true,
  iloProfile: { include: { institution: { select: { id: true, name: true } } } },
} as const;

export async function listUsers(role?: RoleCode) {
  return prisma.user.findMany({
    where: role
      ? { userRoles: { some: { role: { code: role as RoleType } } } }
      : undefined,
    orderBy: { createdAt: 'desc' },
    include: userInclude,
  });
}

export async function getUser(id: string) {
  return prisma.user.findUnique({ where: { id }, include: userInclude });
}

export async function getUserOrThrow(id: string) {
  const user = await getUser(id);
  if (!user) throw new AppError('User not found.', 'NOT_FOUND');
  return user;
}

function traineeProfileData(input: UserCreateInput | UserUpdateInput) {
  return {
    registrationNumber: input.registrationNumber ?? null,
    programmeId: input.programmeId ?? null,
  };
}

function mentorProfileData(input: UserCreateInput | UserUpdateInput) {
  return {
    companyName: input.companyName ?? null,
    jobTitle: input.jobTitle ?? null,
    contactEmail: input.contactEmail ?? null,
    phone: input.phone ?? null,
  };
}

function iloProfileData(input: UserCreateInput | UserUpdateInput) {
  return {
    designation: input.designation ?? null,
    officeEmail: input.officeEmail ?? null,
    institutionId: input.institutionId ?? null,
  };
}

export async function createUser(input: UserCreateInput, actorId: string) {
  const passwordHash = await hashPassword(input.password);
  const roles = input.roles;

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      status: input.status,
      userRoles: {
        create: roles.map((code) => ({ role: { connect: { code: code as RoleType } } })),
      },
      traineeProfile: roles.includes('TRAINEE')
        ? { create: traineeProfileData(input) }
        : undefined,
      mentorProfile: roles.includes('MENTOR')
        ? { create: mentorProfileData(input) }
        : undefined,
      iloProfile: roles.includes('ILO') ? { create: iloProfileData(input) } : undefined,
    },
  });

  logAuditEvent({
    action: 'USER_CREATE',
    actorId,
    targetType: 'User',
    targetId: user.id,
    metadata: { roles },
  });
  return user;
}

export async function updateUser(
  id: string,
  input: UserUpdateInput,
  actorId: string
) {
  const existing = await prisma.user.findUnique({
    where: { id },
    include: { userRoles: { include: { role: true } } },
  });
  if (!existing) throw new AppError('User not found.', 'NOT_FOUND');

  const roles = existing.userRoles.map((ur) => ur.role.code as RoleCode);

  const user = await prisma.user.update({
    where: { id },
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      status: input.status,
      traineeProfile: roles.includes('TRAINEE')
        ? { upsert: { create: traineeProfileData(input), update: traineeProfileData(input) } }
        : undefined,
      mentorProfile: roles.includes('MENTOR')
        ? { upsert: { create: mentorProfileData(input), update: mentorProfileData(input) } }
        : undefined,
      iloProfile: roles.includes('ILO')
        ? { upsert: { create: iloProfileData(input), update: iloProfileData(input) } }
        : undefined,
    },
  });

  logAuditEvent({
    action: 'USER_UPDATE',
    actorId,
    targetType: 'User',
    targetId: user.id,
  });
  return user;
}

export async function setUserStatus(
  id: string,
  status: 'ACTIVE' | 'INACTIVE',
  actorId: string
) {
  if (id === actorId && status === 'INACTIVE') {
    throw new AppError('You cannot deactivate your own account.', 'INVALID_STATE');
  }
  const user = await prisma.user.update({ where: { id }, data: { status } });
  logAuditEvent({
    action: 'USER_STATUS_CHANGE',
    actorId,
    targetType: 'User',
    targetId: user.id,
    metadata: { status },
  });
  return user;
}

export async function assignRole(userId: string, role: RoleCode, actorId: string) {
  const roleRecord = await prisma.role.findUnique({ where: { code: role as RoleType } });
  if (!roleRecord) throw new AppError('Unknown role.', 'VALIDATION');

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) throw new AppError('User not found.', 'NOT_FOUND');

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId: roleRecord.id } },
    update: {},
    create: { userId, roleId: roleRecord.id },
  });

  logAuditEvent({
    action: 'USER_ROLE_ASSIGN',
    actorId,
    targetType: 'User',
    targetId: userId,
    metadata: { role },
  });
}

export async function removeRole(
  userId: string,
  role: RoleCode,
  actorId: string
) {
  const roleRecord = await prisma.role.findUnique({ where: { code: role as RoleType } });
  if (!roleRecord) throw new AppError('Unknown role.', 'VALIDATION');

  const current = await prisma.userRole.findMany({
    where: { userId },
    select: { roleId: true },
  });
  if (current.length <= 1) {
    throw new AppError('A user must keep at least one role.', 'INVALID_STATE');
  }
  if (role === 'ADMIN' && userId === actorId) {
    throw new AppError('You cannot remove your own administrator role.', 'INVALID_STATE');
  }

  await prisma.userRole.deleteMany({ where: { userId, roleId: roleRecord.id } });

  logAuditEvent({
    action: 'USER_ROLE_REMOVE',
    actorId,
    targetType: 'User',
    targetId: userId,
    metadata: { role },
  });
}

export async function resetPassword(id: string, password: string, actorId: string) {
  const passwordHash = await hashPassword(password);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
  logAuditEvent({
    action: 'USER_UPDATE',
    actorId,
    targetType: 'User',
    targetId: id,
    metadata: { passwordReset: true },
  });
}

/** Active mentors for assignment selectors. */
export async function listMentorOptions() {
  return prisma.user.findMany({
    where: {
      status: 'ACTIVE',
      userRoles: { some: { role: { code: 'MENTOR' } } },
    },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      mentorProfile: { select: { companyName: true, jobTitle: true } },
    },
  });
}

/** Active trainees for assignment selectors. */
export async function listTraineeOptions() {
  return prisma.user.findMany({
    where: {
      status: 'ACTIVE',
      userRoles: { some: { role: { code: 'TRAINEE' } } },
    },
    orderBy: { name: 'asc' },
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
  });
}