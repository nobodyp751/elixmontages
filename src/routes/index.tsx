import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Lock, MessagesSquare, RefreshCw, Sparkles, Star, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorCard } from "@/components/elix/editor-card";
import { editorsQuery } from "@/lib/queries";
import { STYLES } from "@/lib/elix";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Elix — Trouvez votre monteur TikTok, Reels et Shorts" },
      {
        name: "description",
        content:
          "Commandez une vidéo ou un pack mensuel à des monteurs spécialisés format vertical. Paiement bloqué en séquestre jusqu'à votre validation.",
      },
      { property: "og:title", content: "Elix — Trouvez votre monteur TikTok, Reels et Shorts" },
      {
        property: "og:description",
        content: "Des monteurs spécialisés format vertical, un paiement sécurisé en séquestre, des retouches incluses.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(editorsQuery()),
  component: Home,
});

const HERO_SHOTS = [
  { src: "/images/demo/gaming.jpg", label: "Gaming · 28 s", tilt: "-7deg", delay: "0s" },
  { src: "/images/demo/business.jpg", label: "Business · 45 s", tilt: "0deg", delay: "0.8s" },
  { src: "/images/demo/humour.jpg", label: "Humour · 19 s", tilt: "7deg", delay: "1.6s" },
];

function Home() {
  const { data: editors } = useSuspenseQuery(editorsQuery());
  const featured = editors.slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero">
        <div className="pointer-events-none absolute inset-0 grid-lines opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-foreground/5 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> 100 % TikTok · Reels · Shorts
            </span>
            <h1 className="mt-6 text-5xl font-extrabold leading-[0.95] sm:text-6xl lg:text-7xl">
              Tes rushs bruts.
              <br />
              <span className="text-primary">Montés pour</span> exploser.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Choisis un monteur spécialisé, dépose le lien de tes rushs et paie en ligne. Ton argent reste bloqué en
              séquestre jusqu'à ce que tu valides la vidéo.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="xl">
                <Link to="/monteurs">
                  Trouver mon monteur <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="glass" size="xl">
                <Link to="/devenir-monteur">Je suis monteur</Link>
              </Button>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-6">
              {[
                ["2 clics", "pour commander"],
                ["100 %", "argent protégé"],
                ["9:16", "format natif"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="font-display text-2xl font-bold">{k}</dt>
                  <dd className="text-xs text-muted-foreground">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative mx-auto flex h-[520px] w-full max-w-md items-center justify-center">
            {HERO_SHOTS.map((s, i) => (
              <div
                key={s.src}
                className="absolute w-44 animate-float sm:w-52"
                style={{
                  ["--tilt" as string]: s.tilt,
                  animationDelay: s.delay,
                  left: `${i * 30}%`,
                  zIndex: i === 1 ? 3 : 1,
                  top: i === 1 ? "6%" : "14%",
                }}
              >
                <div className="overflow-hidden rounded-[1.75rem] border-4 border-foreground/10 bg-card shadow-card">
                  <div className="relative aspect-[9/16]">
                    <img src={s.src} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-scrim" />
                    <span className="absolute bottom-3 left-3 rounded-full bg-background/70 px-2 py-0.5 text-[11px] backdrop-blur">
                      {s.label}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div className="absolute -bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-2xl border border-border bg-popover/90 px-4 py-3 shadow-card backdrop-blur">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-primary" />
                <div className="text-sm">
                  <p className="font-semibold">120 € bloqués en séquestre</p>
                  <p className="text-xs text-muted-foreground">Libérés à ta validation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Styles marquee */}
      <section className="border-y border-border bg-surface py-5">
        <div className="overflow-hidden">
          <div className="flex w-max animate-marquee gap-3">
            {[...STYLES, ...STYLES, ...STYLES, ...STYLES].map((s, i) => (
              <Link
                key={i}
                to="/monteurs"
                search={{ style: s.value }}
                className="rounded-full border border-border px-5 py-2 font-display text-lg font-bold transition-colors hover:border-primary hover:text-primary"
              >
                {s.emoji} {s.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured editors */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Les mieux notés</p>
            <h2 className="mt-2 text-4xl font-extrabold">Des monteurs qui parlent TikTok</h2>
          </div>
          <Button asChild variant="glass">
            <Link to="/monteurs">
              Voir tout le catalogue <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((e) => (
            <EditorCard key={e.id} editor={e} />
          ))}
        </div>
      </section>

      {/* Escrow split */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <div className="grid gap-10 rounded-[2rem] border border-border bg-card p-8 shadow-card md:grid-cols-2 md:p-12">
          <div>
            <h2 className="text-4xl font-extrabold">Un paiement qui protège les deux côtés.</h2>
            <p className="mt-4 text-muted-foreground">
              Le créateur paie à la commande, l'argent est bloqué chez Elix. Le monteur sait qu'il sera payé, le créateur
              ne débloque qu'une fois satisfait.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                [Lock, "Argent en séquestre jusqu'à la validation"],
                [RefreshCw, "Retouches incluses dans chaque offre"],
                [MessagesSquare, "Messagerie et livraison au même endroit"],
              ].map(([Icon, t], i) => {
                const I = Icon as typeof Lock;
                return (
                  <li key={i} className="flex items-center gap-3">
                    <I className="h-5 w-5 text-primary" /> {t as string}
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-sm text-muted-foreground">Exemple pour une commande de</p>
            <p className="font-display text-6xl font-extrabold">100 €</p>
            <div className="mt-6 h-4 w-full overflow-hidden rounded-full bg-split" />
            <div className="mt-4 flex justify-between text-sm">
              <div>
                <p className="font-display text-2xl font-bold text-primary">85 €</p>
                <p className="text-muted-foreground">versés au monteur</p>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl font-bold text-accent">15 €</p>
                <p className="text-muted-foreground">frais de service Elix</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two audiences */}
      <section className="mx-auto grid max-w-7xl gap-6 px-4 pt-24 sm:px-6 md:grid-cols-2">
        <div className="rounded-[2rem] border border-border p-8">
          <Star className="h-8 w-8 text-primary" />
          <h3 className="mt-4 text-3xl font-extrabold">Pour les créateurs</h3>
          <p className="mt-3 text-muted-foreground">
            Filtre par style, regarde les portfolios en format vertical, commande une vidéo ou un pack de 10 vidéos par
            mois. Tu ne paies le monteur qu'une fois la vidéo validée.
          </p>
          <Button asChild variant="hero" className="mt-6">
            <Link to="/monteurs">Explorer les monteurs</Link>
          </Button>
        </div>
        <div className="rounded-[2rem] border border-border bg-primary p-8 text-primary-foreground">
          <Wallet className="h-8 w-8" />
          <h3 className="mt-4 text-3xl font-extrabold">Pour les monteurs</h3>
          <p className="mt-3 opacity-80">
            Une vitrine pro avec ton showreel, tes tarifs et tes disponibilités. Tu commences à monter en sachant que
            l'argent est déjà déposé.
          </p>
          <Button asChild variant="secondary" className="mt-6 rounded-full">
            <Link to="/devenir-monteur">Créer ma vitrine</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
