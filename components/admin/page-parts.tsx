import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/10 px-6 py-12 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const active = status === 'ACTIVE';
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[11px] font-medium',
        active
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
          : 'border-border bg-muted text-muted-foreground'
      )}
    >
      {status}
    </Badge>
  );
}

export function DocumentStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    UPLOADED: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400',
    PROCESSING: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
    EXTRACTED: 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400',
    REVIEW_REQUIRED:
      'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400',
    VALIDATED: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    FAILED: 'border-destructive/30 bg-destructive/10 text-destructive',
    ARCHIVED: 'border-border bg-muted text-muted-foreground',
  };
  return (
    <Badge
      variant="outline"
      className={cn('text-[11px] font-medium', styles[status] ?? 'border-border bg-muted text-muted-foreground')}
    >
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}

export function TemplateStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    EXTRACTION_DRAFT:
      'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
    VALIDATED: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    PUBLISHED: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400',
    ARCHIVED: 'border-border bg-muted text-muted-foreground',
  };
  return (
    <Badge
      variant="outline"
      className={cn('text-[11px] font-medium', styles[status] ?? 'border-border bg-muted text-muted-foreground')}
    >
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}

export function DataTable({
  head,
  children,
}: {
  head: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-muted/30 text-left text-xs font-semibold text-muted-foreground">
          {head}
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}