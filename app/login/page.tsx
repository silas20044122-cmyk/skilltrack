'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useActionState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { loginAction, type LoginActionState } from './actions';
import { SEED_USERS } from '@/lib/auth/user-store';
import {
  Lock,
  Mail,
  AlertCircle,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const reason = searchParams.get('reason');

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [fillNotice, setFillNotice] = React.useState<string | null>(null);

  const [state, formAction, isPending] = useActionState<LoginActionState, FormData>(
    loginAction,
    {}
  );

  const handleFillCredentials = (userEmail: string, userPass: string, roleName: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setFillNotice(`Loaded test credentials for ${roleName}`);
    setTimeout(() => setFillNotice(null), 3000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Header bar */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between py-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>SkillTrack Auth · Sprint 2</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto w-full my-8 space-y-6">
        <div className="space-y-1.5 text-center">
          <div className="inline-flex items-center gap-2 mb-1">
            <span className="text-xl font-bold tracking-tight text-foreground">
              SkillTrack
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Sign In to Your Account
          </h1>
          <p className="text-xs text-muted-foreground">
            TVET Workplace Mentoring & Attachment Management System
          </p>
        </div>

        {/* Reason banner if redirected */}
        {reason && (
          <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{reason}</span>
          </div>
        )}

        {/* Error message from action */}
        {state.error && (
          <div
            role="alert"
            className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-start gap-2"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold">Authentication Error</p>
              <p>{state.error}</p>
            </div>
          </div>
        )}

        {/* Quick Fill Confirmation */}
        {fillNotice && (
          <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{fillNotice}</span>
          </div>
        )}

        {/* Unified Login Card */}
        <Card className="border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Institutional Credentials</CardTitle>
            <CardDescription className="text-xs">
              Single sign-on endpoint for all TVET roles. Your permissions are determined automatically.
            </CardDescription>
          </CardHeader>

          <form action={formAction}>
            <input type="hidden" name="callbackUrl" value={callbackUrl} />

            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">
                  Institutional Email Address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="name@institution.ac.ke"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-8 text-xs"
                    disabled={isPending}
                  />
                  <Mail className="h-4 w-4 text-muted-foreground absolute left-2.5 top-2 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium">
                    Password
                  </Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-8 text-xs"
                    disabled={isPending}
                  />
                  <Lock className="h-4 w-4 text-muted-foreground absolute left-2.5 top-2 pointer-events-none" />
                </div>
              </div>

              <div className="pt-1">
                <Button
                  type="submit"
                  className="w-full text-xs font-medium h-9"
                  disabled={isPending}
                >
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Authenticating...
                    </span>
                  ) : (
                    'Sign In to SkillTrack'
                  )}
                </Button>
              </div>
            </CardContent>

            <CardFooter className="pt-0 pb-4 text-center flex flex-col gap-2">
              <p className="text-[11px] text-muted-foreground">
                No public registration. Accounts are provisioned and invited by TVET Institution Administrators.
              </p>
            </CardFooter>
          </form>
        </Card>

        {/* Development Seed Testing Helpers */}
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <KeyRound className="h-3.5 w-3.5 text-primary" />
              <span>Development Test Accounts</span>
            </div>
            <Badge variant="outline" className="text-[10px]">
              Local / Dev Only
            </Badge>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Click any role to populate its pre-configured test credentials:
          </p>

          <div className="grid grid-cols-2 gap-1.5">
            {SEED_USERS.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() =>
                  handleFillCredentials(
                    user.email,
                    user.passwordPlain,
                    user.roles.join(' + ') + (user.status === 'INACTIVE' ? ' (Inactive)' : '')
                  )
                }
                className="text-left p-2 rounded-md border border-border bg-card hover:bg-muted/70 transition-colors space-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-foreground truncate">
                    {user.roles.join(', ')}
                  </span>
                  {user.status === 'INACTIVE' && (
                    <span className="text-[9px] text-destructive font-mono">INACTIVE</span>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {user.email}
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-md mx-auto w-full text-center py-4">
        <p className="text-[11px] text-muted-foreground">
          SkillTrack TVET Workplace Mentoring &copy; {new Date().getFullYear()} · All rights reserved.
        </p>
      </footer>
    </div>
  );
}
