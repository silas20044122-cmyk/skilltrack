import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { AppError } from '@/lib/errors';
import { logAuditEvent } from '@/lib/audit/log-audit-event';
import type {
  CurriculumUnitInput,
  CurriculumUnitUpdateInput,
} from '@/lib/validation/schemas';

export const CURRICULUM_UNITS_TAG = 'curriculum-units';

/**
 * Curriculum unit domain services.
 *
 * Curriculum units are configuration data, not code: the ICT test case's 11
 * units are seeded, never hard-coded. Units belong to a programme and provide
 * the vocabulary that editorial reviewers map template sections onto.
 */

export async function listCurriculumUnits(programmeId: string) {
  return prisma.curriculumUnit.findMany({
    where: { programmeId },
    orderBy: [{ position: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { sectionLinks: true } } },
  });
}

/**
 * Compact active-unit options, read on every review/editor screen. Cached with
 * the `curriculum-units` tag (invalidated by the unit actions) so the hot path
 * doesn't pay a database round-trip on each navigation.
 */
export const listCurriculumUnitOptions = unstable_cache(
  async (programmeId: string) => {
    return prisma.curriculumUnit.findMany({
      where: { programmeId, status: 'ACTIVE' },
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
      select: { id: true, code: true, name: true, position: true },
    });
  },
  ['curriculum-unit-options'],
  { tags: [CURRICULUM_UNITS_TAG], revalidate: 300 }
);

export async function getCurriculumUnit(id: string) {
  return prisma.curriculumUnit.findUnique({
    where: { id },
    include: { programme: { select: { id: true, name: true, code: true } } },
  });
}

async function assertProgramme(programmeId: string) {
  const programme = await prisma.programme.findUnique({
    where: { id: programmeId },
    select: { id: true },
  });
  if (!programme) {
    throw new AppError('The selected programme does not exist.', 'NOT_FOUND', {
      programmeId: ['Select a valid programme.'],
    });
  }
}

export async function createCurriculumUnit(input: CurriculumUnitInput, actorId: string) {
  await assertProgramme(input.programmeId);
  const unit = await prisma.curriculumUnit.create({
    data: {
      programmeId: input.programmeId,
      code: input.code,
      name: input.name,
      description: input.description ?? null,
      position: input.position ?? 0,
    },
  });
  logAuditEvent({
    action: 'CURRICULUM_UNIT_CREATE',
    actorId,
    targetType: 'CurriculumUnit',
    targetId: unit.id,
    metadata: { programmeId: unit.programmeId, code: unit.code },
  });
  return unit;
}

export async function updateCurriculumUnit(
  id: string,
  input: CurriculumUnitUpdateInput,
  actorId: string
) {
  const existing = await prisma.curriculumUnit.findUnique({ where: { id } });
  if (!existing) throw new AppError('The curriculum unit could not be found.', 'NOT_FOUND');

  const unit = await prisma.curriculumUnit.update({
    where: { id },
    data: {
      code: input.code,
      name: input.name,
      description: input.description ?? null,
      ...(input.position === undefined ? {} : { position: input.position }),
    },
  });
  logAuditEvent({
    action: 'CURRICULUM_UNIT_UPDATE',
    actorId,
    targetType: 'CurriculumUnit',
    targetId: unit.id,
  });
  return unit;
}

export async function setCurriculumUnitStatus(
  id: string,
  status: 'ACTIVE' | 'INACTIVE',
  actorId: string
) {
  const unit = await prisma.curriculumUnit.update({ where: { id }, data: { status } });
  logAuditEvent({
    action: 'CURRICULUM_UNIT_UPDATE',
    actorId,
    targetType: 'CurriculumUnit',
    targetId: unit.id,
    metadata: { status },
  });
  return unit;
}
