import { Link } from "@tanstack/react-router";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            La place de marché 100 % dédiée au montage vertical : TikTok, Reels et Shorts. Paiement en séquestre, livraison
            et retouches au même endroit.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">Créateurs</p>
          <Link to="/monteurs" className="block text-muted-foreground hover:text-foreground">Trouver un monteur</Link>
          <Link to="/comment-ca-marche" className="block text-muted-foreground hover:text-foreground">Comment ça marche</Link>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">Monteurs</p>
          <Link to="/devenir-monteur" className="block text-muted-foreground hover:text-foreground">Devenir monteur</Link>
          <Link to="/auth" search={{ mode: "signup" }} className="block text-muted-foreground hover:text-foreground">Créer mon compte</Link>
        </div>
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Elix — Montage vidéo vertical à la demande
      </div>
    </footer>
  );
}
