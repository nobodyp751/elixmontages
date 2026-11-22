import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeEuro, CalendarCheck, Clapperboard, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/devenir-monteur")({
  head: () => ({
    meta: [
      { title: "Devenir monteur sur Elix — Vends tes montages TikTok" },
      {
        name: "description",
        content: "Crée ta vitrine de monteur vidéo vertical : showreel, tarifs, disponibilités. Paiement garanti en séquestre.",
      },
      { property: "og:title", content: "Devenir monteur sur Elix" },
      { property: "og:description", content: "Trouve des clients TikTok sans démarcher. L'argent est déposé avant que tu commences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BecomeEditor,
});

const PERKS = [
  { icon: Clapperboard, title: "Vitrine pro", text: "Jusqu'à 3 vidéos de portfolio classées par durée et style, une bio et tes offres." },
  { icon: ShieldCheck, title: "Paiement garanti", text: "Le créateur dépose l'argent avant que tu commences. Plus d'impayés." },
  { icon: CalendarCheck, title: "Tes règles", text: "Tes tarifs, tes packs, tes délais, tes retouches incluses, ta disponibilité." },
  { icon: BadgeEuro, title: "85 % pour toi", text: "Elix prélève 15 % de frais de service, le reste est pour toi à chaque validation." },
];

function BecomeEditor() {
  return (
    <div className="relative overflow-hidden bg-hero">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <p className="text-sm font-medium text-primary">Pour les monteurs</p>
        <h1 className="mt-2 max-w-3xl text-5xl font-extrabold sm:text-6xl">Monte. Livre. Encaisse. Sans démarcher.</h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Les créateurs TikTok, Reels et Shorts viennent sur Elix pour trouver leur monteur. Crée ta vitrine en 5 minutes.
        </p>
        <Button asChild variant="hero" size="xl" className="mt-8">
          <Link to="/auth" search={{ mode: "signup", role: "editor" }}>
            Créer ma vitrine gratuitement
          </Link>
        </Button>
        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          {PERKS.map((p) => (
            <div key={p.title} className="rounded-3xl border border-border bg-card p-6 shadow-card">
              <p.icon className="h-7 w-7 text-primary" />
              <h2 className="mt-4 text-xl font-bold">{p.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{p.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
