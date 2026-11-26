import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { StudioData } from "@/lib/app-queries";
import { setPortfolioCode } from "@/lib/portfolio.functions";
import { portfolioCodeSchema } from "@/lib/portfolio-security";
import { errorMessage } from "@/lib/elix";
import { VerticalPlayer } from "./vertical-player";
import { EmptyState } from "./app-ui";

function ProtectedVideo({ video }: { video: StudioData["portfolio"][number] }) {
  const save = useServerFn(setPortfolioCode);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const update = async (value: string | null) => {
    setBusy(true);
    try {
      await save({ data: { videoId: video.id, code: value } });
      setCode(""); setFeedback(value ? "Code enregistré" : "Téléchargements bloqués");
      toast.success(value ? "Code enregistré. Transmettez-le uniquement aux personnes autorisées." : "Code retiré : téléchargements bloqués.");
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };
  return <article className="min-w-0 space-y-3">
    <VerticalPlayer src={video.src} poster={video.poster_url} title={video.title} duration={video.duration_category} style={video.style} />
    {video.video_path ? <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void update(code); }}>
      <label htmlFor={`protect-${video.id}`} className="flex items-center gap-2 text-sm font-semibold"><LockKeyhole className="h-4 w-4" />Code de téléchargement</label>
      <Input id={`protect-${video.id}`} type="password" autoComplete="new-password" minLength={8} maxLength={64} value={code} onChange={(event) => setCode(event.target.value)} aria-describedby={`hint-${video.id}`} />
      <p id={`hint-${video.id}`} className="text-xs text-muted-foreground">8 à 64 caractères, au moins une lettre et un chiffre.</p>
      <Button type="submit" className="w-full" disabled={busy || !portfolioCodeSchema.safeParse(code).success}><KeyRound />Enregistrer le code</Button>
      <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={() => void update(null)}><ShieldCheck />Bloquer les téléchargements</Button>
      {feedback && <p role="status" className="text-sm text-success">{feedback}</p>}
    </form> : <p className="text-sm text-muted-foreground">Aucun fichier hébergé à télécharger.</p>}
  </article>;
}

export function PortfolioProtection({ portfolio }: { portfolio: StudioData["portfolio"] }) {
  return <section>
    <h2 className="mb-4 text-xl font-bold">Portfolio · Accès aux fichiers</h2>
    {portfolio.length ? <div className="grid gap-6 sm:grid-cols-3">{portfolio.map((video) => <ProtectedVideo key={video.id} video={video} />)}</div> : <EmptyState icon={LockKeyhole} title="Aucun fichier dans votre portfolio" />}
  </section>;
}