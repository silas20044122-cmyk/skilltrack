import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { getDefaultLandingPath } from '@/lib/permissions/rbac';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, ArrowLeft, LogOut, Home } from 'lucide-react';

export default async function UnauthorizedPage(props: {
  searchParams?: Promise<{ reason?: string; from?: string }>;
}) {
  const searchParams = await props.searchParams;
  const reason = searchParams?.reason || 'You do not have permission to access this resource.';
  const from = searchParams?.from || '';

  const user = await getCurrentUser();
  const returnPath = user ? getDefaultLandingPath(user.primaryRole) : '/login';

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Home className="h-4 w-4" />
          <span>SkillTrack Home</span>
        </Link>
        <Badge variant="outline" className="text-xs font-mono text-destructive">
          403 Forbidden
        </Badge>
      </header>

      {/* Main Alert Card */}
      <main className="max-w-md mx-auto w-full my-8">
        <Card className="border-border">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-2">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl">Access Restricted</CardTitle>
            <CardDescription className="text-xs">
              Role-Based Access Control policy prevented access to this route.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-xs">
            <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 space-y-1">
              <span className="font-semibold text-destructive">Policy Rule</span>
              <p className="text-muted-foreground">{reason}</p>
              {from && (
                <p className="text-[11px] text-muted-foreground font-mono pt-1">
                  Requested route: {from}
                </p>
              )}
            </div>

            {user && (
              <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1.5">
                <span className="font-semibold text-foreground">Current Account Status</span>
                <p className="text-muted-foreground">{user.name} ({user.email})</p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-muted-foreground">Assigned Roles:</span>
                  {user.roles.map((r) => (
                    <Badge key={r} variant="outline" className="text-[10px]">
                      {r}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-2 pt-2">
            <Link
              href={returnPath}
              className={buttonVariants({ variant: 'default', size: 'default', className: 'w-full text-xs' })}
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              Return to Authorized Area ({user?.primaryRole ?? 'Login'})
            </Link>

            <Link
              href="/login"
              className={buttonVariants({ variant: 'outline', size: 'default', className: 'w-full text-xs' })}
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Sign In with Different Account
            </Link>
          </CardFooter>
        </Card>
      </main>

      {/* Footer */}
      <footer className="max-w-md mx-auto w-full text-center py-4">
        <p className="text-[11px] text-muted-foreground">
          SkillTrack TVET Security Gateway &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
