import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { EditorAvatar } from "@/components/elix/editor-avatar";
import { StarRating } from "@/components/elix/star-rating";
import { VerticalPlayer } from "@/components/elix/vertical-player";
import { PortfolioDownload } from "@/components/elix/portfolio-download";
import { editorQuery } from "@/lib/queries";
import { STYLE_LABEL, formatEuros } from "@/lib/elix";

export const Route = createFileRoute("/monteurs/$id")({
  loader: async ({ context, params }) => {
    const e = await context.queryClient.ensureQueryData(editorQuery(params.id));
    if (!e) throw notFound();
    return { name: e.display_name, headline: e.headline };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.name} — Monteur vidéo sur Elix` : "Monteur — Elix" },
      { name: "description", content: loaderData?.headline ?? "Profil de monteur vidéo sur Elix." },
      { property: "og:title", content: loaderData ? `${loaderData.name} — Elix` : "Monteur — Elix" },
      { property: "og:description", content: loaderData?.headline ?? "Profil de monteur vidéo sur Elix." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditorPage,
});

function EditorPage() {
  const { id } = Route.useParams();
  const { data: e } = useSuspenseQuery(editorQuery(id));
  if (!e) return null;
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex items-center gap-4">
        <EditorAvatar name={e.display_name} url={e.avatar_url} className="h-16 w-16 text-lg" />
        <div>
          <h1 className="text-4xl font-extrabold">{e.display_name}</h1>
          <p className="text-muted-foreground">{e.headline}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <StarRating value={e.rating_avg} count={e.rating_count} />
            {e.styles.map((s) => <span key={s} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs">{STYLE_LABEL[s]}</span>)}
          </div>
        </div>
      </div>
      <p className="mt-6 max-w-3xl whitespace-pre-line text-muted-foreground">{e.bio}</p>
      <h2 className="mt-10 text-2xl font-bold">Portfolio</h2>
      <div className="mt-4 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3">
        {e.portfolio.map((v) => (
          <div key={v.id} className="min-w-0">
            <VerticalPlayer src={v.src} poster={v.poster_url} title={v.title} duration={v.duration_category} style={v.style} />
            {!e.is_demo && <PortfolioDownload videoId={v.id} title={v.title} />}
          </div>
        ))}
      </div>
      <h2 className="mt-10 text-2xl font-bold">Offres</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {e.offers.map((o) => (
          <div key={o.id} className="rounded-3xl border border-border bg-card p-6">
            <p className="text-xs text-primary">{o.kind === "pack" ? `Pack · ${o.videos_count} vidéos` : "Vidéo à l'unité"}</p>
            <h3 className="mt-1 text-xl font-bold">{o.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{o.description}</p>
            <p className="mt-3 text-sm">{o.included_revisions} retouches incluses · puis {formatEuros(o.extra_revision_cents)} · livraison {o.delivery_days} j</p>
            <p className="mt-3 font-display text-3xl font-extrabold">{formatEuros(o.price_cents, true)}</p>
            {e.is_demo && <p className="mt-2 text-xs text-muted-foreground">Profil de démonstration — commande indisponible.</p>}
          </div>
        ))}
      </div>
      <h2 className="mt-10 text-2xl font-bold">Avis</h2>
      <ul className="mt-4 space-y-3">
        {e.reviews.map((r) => (
          <li key={r.id} className="rounded-2xl border border-border p-4">
            <StarRating value={r.rating} /> <span className="ml-2 font-medium">{r.reviewer_name}</span>
            <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
