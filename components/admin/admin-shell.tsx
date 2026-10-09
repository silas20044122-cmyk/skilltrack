'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Building2,
  LayoutDashboard,
  Layers,
  BookOpen,
  Users,
  Link2,
  FileText,
  LogOut,
} from 'lucide-react';
import type { SessionUser } from '@/types/auth';

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/institution', label: 'Institution', icon: Building2 },
  { href: '/admin/departments', label: 'Departments', icon: Layers },
  { href: '/admin/programmes', label: 'Programmes', icon: BookOpen },
  { href: '/admin/documents', label: 'Documents', icon: FileText },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/assignments', label: 'Assignments', icon: Link2 },
];

export function AdminShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/60 backdrop-blur-xs sticky top-0 z-30">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-lg font-bold tracking-tight text-foreground">
              SkillTrack
            </Link>
            <span className="hidden text-xs text-muted-foreground border-l border-border pl-3 sm:inline-block">
              Institution Administration
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden flex-col text-right md:flex">
              <span className="max-w-[200px] truncate text-xs font-semibold text-foreground">
                {user.name}
              </span>
              <span className="max-w-[200px] truncate text-[11px] text-muted-foreground">
                {user.email}
              </span>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              ADMIN
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-xs"
            >
              <LogOut className="h-3.5 w-3.5 mr-1" />
              {isLoggingOut ? 'Signing out…' : 'Sign Out'}
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2 sm:px-6">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      <footer className="border-t border-border py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 text-xs text-muted-foreground sm:px-6">
          <span>SkillTrack TVET Institution Administration</span>
          <span>Sprint 4</span>
        </div>
      </footer>
    </div>
  );
}