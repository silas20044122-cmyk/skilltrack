import { PrismaClient, RoleType, AccountStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function hash(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function main() {
  console.log('🌱 Starting SkillTrack database seeding...');

  // 1. Seed System Roles
  const rolesData: Array<{ code: RoleType; name: string; description: string }> = [
    {
      code: 'ADMIN',
      name: 'System Administrator',
      description: 'National TVET coordinator and institutional system administrator',
    },
    {
      code: 'ILO',
      name: 'Industry Liaison Officer',
      description: 'Institutional coordinator managing industry agreements and attachments',
    },
    {
      code: 'MENTOR',
      name: 'Workplace Mentor',
      description: 'Industry technician supervising daily student tasks and logbook signoffs',
    },
    {
      code: 'TRAINEE',
      name: 'TVET Trainee',
      description: 'Student attached to industry completing vocational logbooks and assessments',
    },
  ];

  const roleMap = new Map<RoleType, string>();

  for (const r of rolesData) {
    const roleRecord = await prisma.role.upsert({
      where: { code: r.code },
      update: { name: r.name, description: r.description },
      create: { code: r.code, name: r.name, description: r.description },
    });
    roleMap.set(r.code, roleRecord.id);
    console.log(`✓ Role confirmed: ${r.code}`);
  }

  // 2. Seed Users
  const seedUsers = [
    {
      id: 'usr_admin_001',
      email: 'admin@skilltrack.gov.tvet',
      name: 'Dr. Sarah Kimani',
      password: 'AdminPass123!',
      status: AccountStatus.ACTIVE,
      roles: ['ADMIN' as RoleType],
    },
    {
      id: 'usr_mentor_001',
      email: 'mentor@workplace.co.ke',
      name: 'Eng. David Ochieng',
      password: 'MentorPass123!',
      status: AccountStatus.ACTIVE,
      roles: ['MENTOR' as RoleType],
      mentorProfile: {
        companyName: 'Apex Precision Engineering Ltd',
        jobTitle: 'Senior Plant Mechanical Supervisor',
      },
    },
    {
      id: 'usr_trainee_001',
      email: 'trainee@polytechnic.ac.ke',
      name: 'Faith Wanjiku',
      password: 'TraineePass123!',
      status: AccountStatus.ACTIVE,
      roles: ['TRAINEE' as RoleType],
      traineeProfile: {
        studentId: 'TVET-2026-MECH-042',
        programme: 'Diploma in Automotive Engineering',
      },
    },
    {
      id: 'usr_ilo_001',
      email: 'ilo@institute.ac.ke',
      name: 'Prof. Patrick Mwangi',
      password: 'IloPass123!',
      status: AccountStatus.ACTIVE,
      roles: ['ILO' as RoleType],
      iloProfile: {
        institution: 'National Technical Polytechnic',
        officeEmail: 'ilo.office@institute.ac.ke',
      },
    },
    {
      id: 'usr_coord_001',
      email: 'coordinator@polytechnic.ac.ke',
      name: 'Grace Mutua',
      password: 'CoordPass123!',
      status: AccountStatus.ACTIVE,
      roles: ['ADMIN' as RoleType, 'ILO' as RoleType],
      iloProfile: {
        institution: 'Regional Polytechnic Council',
        officeEmail: 'g.mutua@polytechnic.ac.ke',
      },
    },
    {
      id: 'usr_inactive_001',
      email: 'inactive@polytechnic.ac.ke',
      name: 'Kelvin Kiprop',
      password: 'InactivePass123!',
      status: AccountStatus.INACTIVE,
      roles: ['TRAINEE' as RoleType],
      traineeProfile: {
        studentId: 'TVET-2025-ELEC-019',
        programme: 'Certificate in Electrical Installation',
      },
    },
  ];

  for (const u of seedUsers) {
    const passwordHash = await hash(u.password);

    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        passwordHash,
        status: u.status,
      },
      create: {
        id: u.id,
        email: u.email,
        name: u.name,
        passwordHash,
        status: u.status,
      },
    });

    for (const roleCode of u.roles) {
      const roleId = roleMap.get(roleCode);
      if (roleId) {
        await prisma.userRole.upsert({
          where: {
            userId_roleId: {
              userId: user.id,
              roleId,
            },
          },
          update: {},
          create: {
            userId: user.id,
            roleId,
          },
        });
      }
    }

    if (u.traineeProfile) {
      await prisma.traineeProfile.upsert({
        where: { userId: user.id },
        update: u.traineeProfile,
        create: {
          userId: user.id,
          ...u.traineeProfile,
        },
      });
    }

    if (u.mentorProfile) {
      await prisma.mentorProfile.upsert({
        where: { userId: user.id },
        update: u.mentorProfile,
        create: {
          userId: user.id,
          ...u.mentorProfile,
        },
      });
    }

    if (u.iloProfile) {
      await prisma.iloProfile.upsert({
        where: { userId: user.id },
        update: u.iloProfile,
        create: {
          userId: user.id,
          ...u.iloProfile,
        },
      });
    }

    console.log(`✓ User seeded: ${u.email} [${u.roles.join(', ')}] status: ${u.status}`);
  }

  console.log('✅ SkillTrack database seeding complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
