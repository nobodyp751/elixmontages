import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { EditorCard } from "@/components/elix/editor-card";
import { editorsQuery } from "@/lib/queries";
import { DURATIONS, STYLES, type DurationCategory, type VideoStyle } from "@/lib/elix";
import { cn } from "@/lib/utils";

type Search = { style?: VideoStyle; duration?: DurationCategory };

export const Route = createFileRoute("/monteurs/")({
  validateSearch: (s: Record<string, unknown>): Search => {
    const out: Search = {};
    if (STYLES.some((x) => x.value === s["style"])) out.style = s["style"] as VideoStyle;
    if (DURATIONS.some((x) => x.value === s["duration"])) out.duration = s["duration"] as DurationCategory;
    return out;
  },
  head: () => ({
    meta: [
      { title: "Catalogue des monteurs vidéo — Elix" },
      { name: "description", content: "Parcourez les monteurs TikTok, Reels et Shorts par style : Gaming, Business, Humour, Vlog." },
      { property: "og:title", content: "Catalogue des monteurs vidéo — Elix" },
      { property: "og:description", content: "Filtrez par style et durée, regardez les portfolios en format vertical." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(editorsQuery()),
  component: Catalog,
});

function Catalog() {
  const { data } = useSuspenseQuery(editorsQuery());
  const { style, duration } = Route.useSearch();
  const list = data.filter(
    (e) =>
      (!style || e.styles.includes(style)) &&
      (!duration || e.portfolio.some((v) => v.duration_category === duration)),
  );
  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-4 py-1.5 text-sm transition-colors",
      active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary",
    );
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="text-5xl font-extrabold">Trouve ton monteur</h1>
      <div className="mt-8 flex flex-wrap gap-2">
        <Link to="/monteurs" search={duration ? { duration } : {}} className={chip(!style)}>Tous les styles</Link>
        {STYLES.map((s) => (
          <Link key={s.value} to="/monteurs" search={duration ? { style: s.value, duration } : { style: s.value }} className={chip(style === s.value)}>
            {s.emoji} {s.label}
          </Link>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link to="/monteurs" search={style ? { style } : {}} className={chip(!duration)}>Toutes durées</Link>
        {DURATIONS.map((d) => (
          <Link key={d.value} to="/monteurs" search={style ? { style, duration: d.value } : { duration: d.value }} className={chip(duration === d.value)}>
            {d.label}
          </Link>
        ))}
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {list.map((e) => <EditorCard key={e.id} editor={e} />)}
      </div>
      {list.length === 0 && <p className="mt-10 text-muted-foreground">Aucun monteur ne correspond à ces filtres.</p>}
    </div>
  );
}
