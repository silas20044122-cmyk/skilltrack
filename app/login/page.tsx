import { Suspense } from 'react';
import { ShieldCheck } from 'lucide-react';
import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Header bar */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">SkillTrack</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>SkillTrack Auth Â· Sprint 2</span>
        </div>
      </header>

      <Suspense fallback={<div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Loading login...</div>}>
        <LoginForm />
      </Suspense>

      {/* Footer */}
      <footer className="max-w-md mx-auto w-full text-center py-4">
        <p className="text-[11px] text-muted-foreground">
          SkillTrack TVET Workplace Mentoring &copy; {new Date().getFullYear()} Â· All rights reserved.
        </p>
      </footer>
    </div>
  );
}
