'use client';

import * as React from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SessionUser, RoleCode } from '@/types/auth';
import { getDefaultLandingPath } from '@/lib/permissions/rbac';
import {
  LogOut,
  ShieldCheck,
  UserCheck,
  Lock,
  ArrowRight,
  Building2,
  BookOpen,
  Briefcase,
  Layers,
} from 'lucide-react';

interface RoleShellProps {
  user: SessionUser;
  pageRole: RoleCode;
  pageTitle: string;
  pageDescription: string;
}

export function RoleShell({
  user,
  pageRole,
  pageTitle,
  pageDescription,
}: RoleShellProps) {
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut({ callbackUrl: '/login' });
  };

  const getRoleIcon = (role: RoleCode) => {
    switch (role) {
      case 'ADMIN':
        return <ShieldCheck className="h-5 w-5 text-primary" />;
      case 'ILO':
        return <Building2 className="h-5 w-5 text-primary" />;
      case 'MENTOR':
        return <Briefcase className="h-5 w-5 text-primary" />;
      case 'TRAINEE':
        return <BookOpen className="h-5 w-5 text-primary" />;
    }
  };

  const availableDestinations = user.roles.map((r) => ({
    role: r,
    path: getDefaultLandingPath(r),
  }));

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      {/* Navigation Top Bar Contract */}
      <header className="border-b border-border bg-card/60 backdrop-blur-xs sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Zone 1: Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-bold tracking-tight text-foreground">
              SkillTrack
            </Link>
            <span className="hidden sm:inline-block text-xs text-muted-foreground border-l border-border pl-3">
              TVET Workplace Mentoring & Attachment Management System
            </span>
          </div>

          {/* Zone 2 & 3: User Details + Logout Action */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-semibold text-foreground truncate max-w-[200px]">
                {user.name}
              </span>
              <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                {user.email}
              </span>
            </div>

            <Badge variant="outline" className="text-xs font-mono">
              {pageRole}
            </Badge>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-xs"
            >
              <LogOut className="h-3.5 w-3.5 mr-1" />
              {isLoggingOut ? 'Signing out...' : 'Sign Out'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full space-y-6">
        {/* Page Identity Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>SkillTrack Verified Route</span>
            <span aria-hidden="true">·</span>
            <span>Role-Based Access Control</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-600 font-medium">Server Authorized</span>
          </div>

          <div className="flex items-center gap-3 pt-1">
            {getRoleIcon(pageRole)}
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {pageTitle}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {pageDescription}
          </p>
        </div>

        {/* Verification Status Card */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-emerald-600" />
              <span>Authentication & Authorization Proof</span>
            </CardTitle>
            <CardDescription className="text-xs">
              This minimal landing page confirms that your identity and role have been verified server-side.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                <span className="text-muted-foreground">Authenticated User</span>
                <p className="font-semibold text-foreground text-sm">{user.name}</p>
                <p className="text-muted-foreground">{user.email}</p>
                <p className="text-[10px] text-muted-foreground font-mono">ID: {user.id}</p>
              </div>

              <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                <span className="text-muted-foreground">Role Assignments</span>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {user.roles.map((r) => (
                    <Badge
                      key={r}
                      variant={r === pageRole ? 'default' : 'outline'}
                      className="text-xs"
                    >
                      {r} {r === user.primaryRole && '(Primary)'}
                    </Badge>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground pt-1">
                  Status:{' '}
                  <span className="font-semibold text-emerald-600">
                    {user.status}
                  </span>
                </p>
              </div>
            </div>

            {/* Multi-role Navigation options */}
            {availableDestinations.length > 1 && (
              <div className="p-3.5 rounded-lg border border-border bg-muted/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Layers className="h-4 w-4 text-primary" />
                  <span>Multi-Role Access Detected</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your account possesses multiple TVET roles. You can navigate between authorized areas:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {availableDestinations.map((dest) => (
                    <Link
                      key={dest.role}
                      href={dest.path}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                        dest.role === pageRole
                          ? 'bg-primary text-primary-foreground border-transparent'
                          : 'bg-card text-foreground border-border hover:bg-muted'
                      }`}
                    >
                      <span>{dest.role} Area</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3 rounded-lg border border-border bg-muted/10 text-xs text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-primary" />
                <span>Protected server route enforced by Next.js App Router Middleware and Server Components.</span>
              </span>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>SkillTrack TVET Workplace Mentoring &copy; {new Date().getFullYear()}</span>
          <span>Sprint 2 RBAC Active</span>
        </div>
      </footer>
    </div>
  );
}
