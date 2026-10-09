import {
  PrismaClient,
  RoleType,
  AccountStatus,
  AssignmentStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function hash(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function main() {
  console.log('🌱 Starting SkillTrack database seeding...');

  // -------------------------------------------------------------------------
  // 1. System Roles
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // 2. Institution
  // ---------------------------------------------------------------------------
  const institution = await prisma.institution.upsert({
    // Key on the stable seed id: the code may have been edited through the UI,
    // so keying on it would attempt a duplicate insert on a re-seed.
    where: { id: 'inst_001' },
    update: {
      name: 'Rift Valley National Polytechnic',
      code: 'RVNP',
      description:
        'A fictional national polytechnic used for SkillTrack development data.',
      email: 'info@rvnp.example.tvet',
      phone: '+254-000-000000',
      address: 'P.O. Box 0000, Nakuru, Kenya',
      status: 'ACTIVE',
    },
    create: {
      id: 'inst_001',
      name: 'Rift Valley National Polytechnic',
      code: 'RVNP',
      description:
        'A fictional national polytechnic used for SkillTrack development data.',
      email: 'info@rvnp.example.tvet',
      phone: '+254-000-000000',
      address: 'P.O. Box 0000, Nakuru, Kenya',
      status: 'ACTIVE',
    },
  });
  console.log(`✓ Institution seeded: ${institution.name}`);

  // 3. Departments
  const departmentsData = [
    {
      id: 'dept_ict',
      code: 'ICT',
      name: 'Information & Communication Technology',
      description: 'Computing, networking, software and digital media programmes.',
    },
    {
      id: 'dept_ame',
      code: 'AME',
      name: 'Automotive & Mechanical Engineering',
      description: 'Automotive, mechanical and plant engineering programmes.',
    },
    {
      id: 'dept_hos',
      code: 'HOS',
      name: 'Hospitality & Institutional Management',
      description: 'Catering, accommodation and institutional management programmes.',
    },
  ];

  const deptMap = new Map<string, string>();
  for (const d of departmentsData) {
    const dept = await prisma.department.upsert({
      where: { institutionId_code: { institutionId: institution.id, code: d.code } },
      update: { name: d.name, description: d.description, status: 'ACTIVE' },
      create: {
        id: d.id,
        institutionId: institution.id,
        code: d.code,
        name: d.name,
        description: d.description,
        status: 'ACTIVE',
      },
    });
    deptMap.set(d.code, dept.id);
    console.log(`✓ Department seeded: ${dept.code} — ${dept.name}`);
  }

  // 4. Programmes
  const programmesData = [
    {
      id: 'prog_dict_l6',
      code: 'DICT-L6',
      name: 'Diploma in Information Communication Technology',
      level: 'Level 6',
      departmentCode: 'ICT',
    },
    {
      id: 'prog_cict_l4',
      code: 'CICT-L4',
      name: 'Craft Certificate in Information Communication Technology',
      level: 'Level 4',
      departmentCode: 'ICT',
    },
    {
      id: 'prog_dae_l6',
      code: 'DAE-L6',
      name: 'Diploma in Automotive Engineering',
      level: 'Level 6',
      departmentCode: 'AME',
    },
    {
      id: 'prog_chm_l5',
      code: 'CHM-L5',
      name: 'Certificate in Hospitality Management',
      level: 'Level 5',
      departmentCode: 'HOS',
    },
  ];

  const progMap = new Map<string, string>();
  for (const p of programmesData) {
    const departmentId = deptMap.get(p.departmentCode)!;
    const prog = await prisma.programme.upsert({
      where: { institutionId_code: { institutionId: institution.id, code: p.code } },
      update: {
        name: p.name,
        level: p.level,
        departmentId,
        status: 'ACTIVE',
      },
      create: {
        id: p.id,
        institutionId: institution.id,
        departmentId,
        code: p.code,
        name: p.name,
        level: p.level,
        status: 'ACTIVE',
      },
    });
    progMap.set(p.code, prog.id);
    console.log(`✓ Programme seeded: ${prog.code} — ${prog.name}`);
  }

  // ---------------------------------------------------------------------------
  // 5. Users, roles and profiles
  // ---------------------------------------------------------------------------
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
        contactEmail: 'd.ochieng@apex.example.co.ke',
        phone: '+254-700-000001',
      },
    },
    {
      id: 'usr_mentor_002',
      email: 'mentor2@workplace.co.ke',
      name: 'Eng. Beatrice Achieng',
      password: 'Mentor2Pass123!',
      status: AccountStatus.ACTIVE,
      roles: ['MENTOR' as RoleType],
      mentorProfile: {
        companyName: 'Lakeview Automotive Works',
        jobTitle: 'Workshop Supervisor',
        contactEmail: 'b.achieng@lakeview.example.co.ke',
        phone: '+254-000-000002',
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
        registrationNumber: 'TVET-2026-ICT-0042',
        programmeCode: 'DICT-L6',
      },
    },
    {
      id: 'usr_trainee_002',
      email: 'trainee2@polytechnic.ac.ke',
      name: 'Brian Otieno',
      password: 'Trainee2Pass123!',
      status: AccountStatus.ACTIVE,
      roles: ['TRAINEE' as RoleType],
      traineeProfile: {
        registrationNumber: 'TVET-2026-AUT-0117',
        programmeCode: 'DAE-L6',
      },
    },
    {
      id: 'usr_trainee_003',
      email: 'trainee3@polytechnic.ac.ke',
      name: 'Mercy Chebet',
      password: 'Trainee3Pass123!',
      status: AccountStatus.ACTIVE,
      roles: ['TRAINEE' as RoleType],
      traineeProfile: {
        registrationNumber: 'TVET-2026-ICT-0203',
        programmeCode: 'CICT-L4',
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
        institutionId: institution.id,
        designation: 'Industry Liaison Officer',
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
        institutionId: institution.id,
        designation: 'Regional Coordinator',
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
        registrationNumber: 'TVET-2025-HOS-0019',
        programmeCode: 'CHM-L5',
      },
    },
  ];

  const userMap = new Map<string, string>();
  for (const u of seedUsers) {
    const passwordHash = await hash(u.password);

    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, passwordHash, status: u.status },
      create: {
        id: u.id,
        email: u.email,
        name: u.name,
        passwordHash,
        status: u.status,
      },
    });
    userMap.set(u.email, user.id);

    for (const roleCode of u.roles) {
      const roleId = roleMap.get(roleCode);
      if (roleId) {
        await prisma.userRole.upsert({
          where: { userId_roleId: { userId: user.id, roleId } },
          update: {},
          create: { userId: user.id, roleId },
        });
      }
    }

    if (u.traineeProfile) {
      const programmeId = u.traineeProfile.programmeCode
        ? progMap.get(u.traineeProfile.programmeCode)!
        : null;
      const data = {
        registrationNumber: u.traineeProfile.registrationNumber,
        programmeId,
      };
      await prisma.traineeProfile.upsert({
        where: { userId: user.id },
        update: data,
        create: { userId: user.id, ...data },
      });
    }

    if (u.mentorProfile) {
      await prisma.mentorProfile.upsert({
        where: { userId: user.id },
        update: u.mentorProfile,
        create: { userId: user.id, ...u.mentorProfile },
      });
    }

    if (u.iloProfile) {
      await prisma.iloProfile.upsert({
        where: { userId: user.id },
        update: u.iloProfile,
        create: { userId: user.id, ...u.iloProfile },
      });
    }

    console.log(`✓ User seeded: ${u.email} [${u.roles.join(', ')}] status: ${u.status}`);
  }

  // ---------------------------------------------------------------------------
  // 6. Mentor -> Trainee assignments
  // ---------------------------------------------------------------------------
  const adminId = userMap.get('admin@skilltrack.gov.tvet')!;
  const mentor1 = userMap.get('mentor@workplace.co.ke')!;
  const mentor2 = userMap.get('mentor2@workplace.co.ke')!;
  const trainee1 = userMap.get('trainee@polytechnic.ac.ke')!;
  const trainee2 = userMap.get('trainee2@polytechnic.ac.ke')!;
  const trainee3 = userMap.get('trainee3@polytechnic.ac.ke')!;

  const assignmentsData = [
    {
      id: 'asg_001',
      mentorId: mentor1,
      traineeId: trainee1,
      status: AssignmentStatus.ACTIVE,
      notes: 'Primary workplace attachment mentoring.',
    },
    {
      id: 'asg_002',
      mentorId: mentor2,
      traineeId: trainee2,
      status: AssignmentStatus.ACTIVE,
      notes: 'Assigned to the automotive workshop.',
    },
    {
      id: 'asg_003',
      mentorId: mentor1,
      traineeId: trainee3,
      status: AssignmentStatus.ACTIVE,
      notes: 'Second trainee for the same mentor (many-to-many supported).',
    },
    {
      id: 'asg_004',
      mentorId: mentor2,
      traineeId: trainee3,
      status: AssignmentStatus.ENDED,
      endDate: new Date('2026-01-31T00:00:00.000Z'),
      notes: 'Historical assignment demonstrating lifecycle tracking.',
    },
  ];

  for (const a of assignmentsData) {
    await prisma.mentorAssignment.upsert({
      where: { id: a.id },
      update: {
        mentorId: a.mentorId,
        traineeId: a.traineeId,
        status: a.status,
        notes: a.notes,
        endDate: a.endDate ?? null,
        assignedById: adminId,
      },
      create: {
        id: a.id,
        mentorId: a.mentorId,
        traineeId: a.traineeId,
        status: a.status,
        notes: a.notes,
        endDate: a.endDate ?? null,
        assignedById: adminId,
      },
    });
    console.log(`✓ Assignment seeded: ${a.id} (${a.status})`);
  }

  // ---------------------------------------------------------------------------
  // 7. Curriculum units (configuration data for the ICT Level 6 programme)
  //
  // These are seeded, never hard-coded in the application: the ICT mentoring
  // tool's 11 competency units are data an administrator can edit. They give
  // reviewers a vocabulary to map extracted sections onto.
  // ---------------------------------------------------------------------------
  const ictProgrammeId = progMap.get('DICT-L6')!;
  const curriculumUnits = [
    'Perform Computer Essentials',
    'Perform Computer Operations',
    'Setup Computer Network',
    'Perform Computer Repair and Maintenance',
    'Install Computer Software',
    'Perform Network Design and Management',
    'Manage Computerized Database Systems',
    'Website Application',
    'ICT Security',
    'Desktop Application',
    'Worker Behaviour',
  ];

  for (const [index, name] of curriculumUnits.entries()) {
    const code = `CU-${String(index + 1).padStart(2, '0')}`;
    await prisma.curriculumUnit.upsert({
      where: { programmeId_code: { programmeId: ictProgrammeId, code } },
      update: { name, position: index, status: 'ACTIVE' },
      create: {
        programmeId: ictProgrammeId,
        code,
        name,
        position: index,
        status: 'ACTIVE',
      },
    });
    console.log(`✓ Curriculum unit seeded: ${code} — ${name}`);
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