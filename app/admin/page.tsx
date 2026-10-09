import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/admin/page-parts';
import { Building2, Layers, BookOpen, Users, Link2 } from 'lucide-react';

export default async function AdminLandingPage() {
  // One batched round-trip instead of five awaited queries. With a small
  // serverless connection pool this avoids five serialized round-trips.
  const [institution, departmentCount, programmeCount, userCount, activeAssignments] =
    await prisma.$transaction([
      prisma.institution.findFirst({ orderBy: { createdAt: 'asc' } }),
      prisma.department.count(),
      prisma.programme.count(),
      prisma.user.count(),
      prisma.mentorAssignment.count({ where: { status: 'ACTIVE' } }),
    ]);

  const tiles = [
    {
      href: '/admin/institution',
      label: 'Institution',
      value: institution?.name ?? 'Not configured',
      icon: Building2,
    },
    { href: '/admin/departments', label: 'Departments', value: String(departmentCount), icon: Layers },
    { href: '/admin/programmes', label: 'Programmes', value: String(programmeCount), icon: BookOpen },
    { href: '/admin/users', label: 'Users', value: String(userCount), icon: Users },
    { href: '/admin/assignments', label: 'Active Assignments', value: String(activeAssignments), icon: Link2 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institution Administration"
        description="Manage the institution structure, departments, programmes, user accounts, roles and mentor-trainee assignments."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link key={tile.href} href={tile.href} className="group">
              <Card className="h-full transition-colors group-hover:border-primary/50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Icon className="h-4 w-4 text-primary" />
                    {tile.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="truncate text-lg font-semibold text-foreground">{tile.value}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick start</CardTitle>
          <CardDescription>
            Begin by confirming the institution, then add departments and programmes before
            creating trainee and mentor accounts.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-sm">
          <Link className="text-primary underline-offset-4 hover:underline" href="/admin/departments">
            Manage departments →
          </Link>
          <Link className="text-primary underline-offset-4 hover:underline" href="/admin/users">
            Manage users →
          </Link>
          <Link className="text-primary underline-offset-4 hover:underline" href="/admin/assignments">
            Manage assignments →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}