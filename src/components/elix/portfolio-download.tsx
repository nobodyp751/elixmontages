import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Download, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { downloadPortfolio } from "@/lib/portfolio.functions";
import { errorMessage } from "@/lib/elix";

export function PortfolioDownload({ videoId, title }: { videoId: string; title: string }) {
  const { user } = useAuth();
  const download = useServerFn(downloadPortfolio);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <div className="mt-3">
    {!open ? <Button variant="outline" className="w-full" onClick={() => setOpen(true)}><LockKeyhole /> Télécharger</Button> : !user ?
      <Button asChild variant="outline" className="w-full"><Link to="/auth" search={{ mode: "signin", redirect: typeof window === "undefined" ? "/monteurs" : window.location.pathname }}>Se connecter</Link></Button> :
      <form className="space-y-2" onSubmit={async (event) => {
        event.preventDefault(); setBusy(true); setError("");
        try {
          const result = await download({ data: { videoId, code } });
          if (!result.url) { setError(result.error ?? "Téléchargement refusé."); return; }
          setCode("");
          const anchor = document.createElement("a"); anchor.href = result.url; anchor.rel = "noreferrer"; anchor.click();
        } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
      }}>
        <label htmlFor={`download-${videoId}`} className="text-sm font-medium">Code d’accès</label>
        <Input id={`download-${videoId}`} aria-label={`Code d’accès — ${title}`} type="password" autoComplete="off" maxLength={64} required value={code} onChange={(event) => setCode(event.target.value)} />
        <Button type="submit" disabled={busy || !code} className="w-full"><Download />{busy ? "Vérification…" : "Télécharger"}</Button>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </form>}
  </div>;
}