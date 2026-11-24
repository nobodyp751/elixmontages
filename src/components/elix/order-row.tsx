import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { EditorAvatar } from "./editor-avatar";
import { StatusBadge } from "./status-badge";
import { formatDate, formatEuros, type OrderStatus } from "@/lib/elix";

export function OrderRow({
  id,
  title,
  status,
  amountCents,
  amountLabel,
  createdAt,
  person,
  personLabel,
  kind,
  videosCount,
}: {
  id: string;
  title: string;
  status: OrderStatus;
  amountCents: number;
  amountLabel?: string;
  createdAt: string;
  person: { display_name: string; avatar_url: string | null } | null;
  personLabel: string;
  kind: "unit" | "pack";
  videosCount: number;
}) {
  const name = person?.display_name || "Utilisateur Elix";
  return (
    <Link
      to="/commandes/$id"
      params={{ id }}
      className="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary/40 hover:bg-secondary"
    >
      <EditorAvatar name={name} url={person?.avatar_url} className="h-11 w-11" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold">{title || "Commande"}</p>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
            {kind === "pack" ? `Pack · ${videosCount} vidéos` : "À l'unité"}
          </span>
        </div>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {personLabel} {name} · {formatDate(createdAt)}
        </p>
      </div>
      <div className="hidden text-right sm:block">
        <p className="font-display text-lg font-bold tabular-nums">{formatEuros(amountCents)}</p>
        {amountLabel && <p className="text-[11px] text-muted-foreground">{amountLabel}</p>}
      </div>
      <StatusBadge status={status} className="hidden md:inline-flex" />
      <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
