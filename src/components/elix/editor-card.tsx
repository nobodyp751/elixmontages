import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import type { EditorSummary } from "@/lib/public.functions";
import { STYLE_LABEL, formatEuros } from "@/lib/elix";
import { EditorAvatar } from "./editor-avatar";
import { StarRating } from "./star-rating";
import { VerticalPlayer } from "./vertical-player";

export function EditorCard({ editor }: { editor: EditorSummary }) {
  const shown = editor.portfolio.slice(0, 3);
  return (
    <Link
      to="/monteurs/$id"
      params={{ id: editor.id }}
      className="group flex flex-col rounded-3xl border border-border bg-card p-3 shadow-card transition-all hover:-translate-y-1 hover:border-primary/40"
    >
      <div className="grid grid-cols-3 gap-2">
        {shown.map((v) => (
          <VerticalPlayer key={v.id} src={null} poster={v.poster_url ?? null} duration={v.duration_category} compact className="rounded-xl" />
        ))}
        {Array.from({ length: Math.max(0, 3 - shown.length) }).map((_, i) => (
          <div key={i} className="aspect-[9/16] rounded-xl border border-dashed border-border bg-muted/40" />
        ))}
      </div>
      <div className="flex items-start gap-3 px-1 pb-1 pt-4">
        <EditorAvatar name={editor.display_name} url={editor.avatar_url} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-lg font-bold">{editor.display_name}</h3>
            <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
          </div>
          <p className="line-clamp-2 text-sm text-muted-foreground">{editor.headline}</p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5 px-1">
        {editor.styles.map((s) => (
          <span key={s} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs">
            {STYLE_LABEL[s]}
          </span>
        ))}
        {editor.has_pack && (
          <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs text-accent">Packs mensuels</span>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border px-1 pt-3">
        <StarRating value={editor.rating_avg} count={editor.rating_count} />
        <span className="text-sm text-muted-foreground">
          dès{" "}
          <span className="font-display text-lg font-bold text-foreground">
            {editor.from_price_cents ? formatEuros(editor.from_price_cents, true) : "—"}
          </span>
        </span>
      </div>
    </Link>
  );
}
