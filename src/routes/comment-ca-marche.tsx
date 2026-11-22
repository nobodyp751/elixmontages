import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, CreditCard, FolderUp, MessagesSquare, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/comment-ca-marche")({
  head: () => ({
    meta: [
      { title: "Comment ça marche — Elix" },
      {
        name: "description",
        content: "Choisir un monteur, déposer ses rushs, payer en séquestre, valider la vidéo : le fonctionnement d'Elix étape par étape.",
      },
      { property: "og:title", content: "Comment ça marche — Elix" },
      { property: "og:description", content: "Du catalogue à la validation : commandez un montage vertical en toute sécurité." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HowItWorks,
});

const STEPS = [
  { icon: Search, title: "Choisis ton monteur", text: "Filtre par style (Gaming, Business, Humour, Vlog…) et regarde jusqu'à 3 vidéos de portfolio en format 9:16." },
  { icon: FolderUp, title: "Dépose tes rushs", text: "Choisis une vidéo à l'unité ou un pack mensuel, colle le lien Google Drive ou Dropbox de tes rushs et ajoute tes consignes." },
  { icon: CreditCard, title: "Paie en séquestre", text: "Tu paies en ligne. L'argent est bloqué chez Elix : le monteur sait qu'il sera payé et commence le montage." },
  { icon: MessagesSquare, title: "Échange et retouche", text: "Messagerie intégrée, livraison des fichiers finaux, retouches incluses selon l'offre (les suivantes sont facturées)." },
  { icon: CheckCircle2, title: "Valide et libère", text: "Satisfait ? Tu valides : 85 % vont au monteur, 15 % sont les frais de service Elix. Un souci ? Ouvre un litige." },
  { icon: Star, title: "Note le monteur", text: "Laisse une note de 1 à 5 étoiles et un commentaire. La moyenne s'affiche sur sa vitrine." },
];

function HowItWorks() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <p className="text-sm font-medium text-primary">Comment ça marche</p>
      <h1 className="mt-2 text-5xl font-extrabold">Du rush brut à la vidéo validée, en 6 étapes.</h1>
      <ol className="mt-12 grid gap-4 md:grid-cols-2">
        {STEPS.map((s, i) => (
          <li key={s.title} className="relative rounded-3xl border border-border bg-card p-6 shadow-card">
            <span className="absolute right-6 top-5 font-display text-5xl font-extrabold text-foreground/5">0{i + 1}</span>
            <s.icon className="h-7 w-7 text-primary" />
            <h2 className="mt-4 text-xl font-bold">{s.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
          </li>
        ))}
      </ol>
      <div className="mt-12 flex flex-wrap gap-3">
        <Button asChild variant="hero" size="xl">
          <Link to="/monteurs">Trouver un monteur</Link>
        </Button>
        <Button asChild variant="glass" size="xl">
          <Link to="/devenir-monteur">Devenir monteur</Link>
        </Button>
      </div>
    </div>
  );
}
