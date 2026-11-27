import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Download, FileVideo, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { errorMessage } from "@/lib/elix";
import { Panel } from "./app-ui";
import { Dropzone } from "./dropzone";

/** Raw footage for an order: the creator drops files, both participants can download them. */
export function RushesPanel({ orderId, rushesUrl, canUpload }: { orderId: string; rushesUrl: string; canUpload: boolean }) {
  const qc = useQueryClient();
  const key = ["rushes", orderId];
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const files = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("rushes").list(orderId, { sortBy: { column: "created_at", order: "desc" } });
      if (error) throw error;
      const items = (data ?? []).filter((f) => f.id);
      if (!items.length) return [];
      const { data: signed } = await supabase.storage.from("rushes").createSignedUrls(items.map((f) => `${orderId}/${f.name}`), 60 * 60, { download: true });
      return items.map((f, i) => ({ name: f.name, size: (f.metadata as { size?: number } | null)?.size ?? 0, url: signed?.[i]?.signedUrl ?? null }));
    },
  });

  const upload = async (list: File[]) => {
    setProgress({ done: 0, total: list.length });
    try {
      for (const [i, f] of list.entries()) {
        const safe = f.name.replace(/[^\w.\-]+/g, "_");
        const { error } = await supabase.storage.from("rushes").upload(`${orderId}/${Date.now()}-${safe}`, f, { contentType: f.type || undefined });
        if (error) throw error;
        setProgress({ done: i + 1, total: list.length });
      }
      toast.success("Rushs envoyés au monteur");
    } catch (e) { toast.error(errorMessage(e)); } finally { setProgress(null); await qc.invalidateQueries({ queryKey: key }); }
  };
  const remove = async (name: string) => {
    const { error } = await supabase.storage.from("rushes").remove([`${orderId}/${name}`]);
    if (error) { toast.error(errorMessage(error)); return; }
    await qc.invalidateQueries({ queryKey: key });
  };

  return (
    <Panel title="Rushs" className="mt-6">
      {rushesUrl && /^https?:\/\//.test(rushesUrl) && <p className="mb-4 text-sm">Lien fourni : <a className="text-primary underline" href={rushesUrl} target="_blank" rel="noreferrer">{rushesUrl}</a></p>}
      {canUpload && <Dropzone accept="video/*,image/*,audio/*,.zip" multiple disabled={!!progress} onFiles={(f) => void upload(f)}
        label={progress ? `Envoi ${progress.done}/${progress.total}…` : "Glissez vos rushs ici"} hint="Vidéos, sons, images ou archives .zip">
        {progress && <Progress value={(progress.done / progress.total) * 100} className="mt-2 w-48" />}
      </Dropzone>}
      <ul className="mt-4 space-y-2">
        {files.data?.map((f) => (
          <li key={f.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border px-3 py-2">
            <span className="flex min-w-0 items-center gap-2"><FileVideo className="h-4 w-4 shrink-0" /><span className="truncate text-sm">{f.name.replace(/^\d+-/, "")}</span><span className="shrink-0 text-xs text-muted-foreground">{(f.size / 1048576).toFixed(1)} Mo</span></span>
            <span className="flex shrink-0 gap-1">
              {f.url && <Button asChild variant="ghost" size="icon" aria-label="Télécharger"><a href={f.url}><Download /></a></Button>}
              {canUpload && <Button variant="ghost" size="icon" aria-label="Supprimer" onClick={() => void remove(f.name)}><Trash2 /></Button>}
            </span>
          </li>))}
        {files.data?.length === 0 && <li className="text-sm text-muted-foreground">Aucun fichier envoyé pour l'instant.</li>}
      </ul>
    </Panel>
  );
}
