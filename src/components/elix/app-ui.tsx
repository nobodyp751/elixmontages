import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="text-sm font-medium text-primary">{eyebrow}</p>}
        <h1 className="mt-1 text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const TONES = {
  default: "text-foreground",
  primary: "text-primary",
  accent: "text-accent",
  warning: "text-warning",
  success: "text-success",
  danger: "text-destructive",
  info: "text-info",
} as const;

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  tone?: keyof typeof TONES;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        {Icon && <Icon className={cn("h-4 w-4", TONES[tone])} />}
      </div>
      <p className={cn("mt-3 font-display text-3xl font-extrabold tabular-nums", TONES[tone])}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  text?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-border px-6 py-14 text-center">
      {Icon && (
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-primary">
          <Icon className="h-6 w-6" />
        </span>
      )}
      <p className="mt-4 text-lg font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-md text-sm text-muted-foreground">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Panel({ title, description, actions, children, className }: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-3xl border border-border bg-card p-6 shadow-card", className)}>
      {(title || actions) && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-xl font-bold">{title}</h2>}
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="h-10 w-64 animate-pulse rounded-xl bg-muted" />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-3xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

export function PageError({ error }: { error: unknown }) {
  return (
    <div role="alert" className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Cette page n'a pas pu se charger</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {error instanceof Error ? error.message : "Une erreur est survenue. Réessayez dans un instant."}
      </p>
    </div>
  );
}
