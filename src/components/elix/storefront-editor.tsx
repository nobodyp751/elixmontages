import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { StudioData } from "@/lib/app-queries";
import { DURATIONS, STYLES, errorMessage, type DurationCategory, type VideoStyle } from "@/lib/elix";
import { MAX_VIDEO_BYTES, PREVIEW_PREFIX, fileExt } from "@/lib/media";
import { cn } from "@/lib/utils";
import { Panel } from "./app-ui";
import { Dropzone } from "./dropzone";
import { VerticalPlayer } from "./vertical-player";

const sel = "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm";

export function StorefrontEditor({ editor, portfolio, userId }: { editor: StudioData["editor"]; portfolio: StudioData["portfolio"]; userId: string }) {
  const qc = useQueryClient();
  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ["studio", userId] }), qc.invalidateQueries({ queryKey: ["editors"] }), qc.invalidateQueries({ queryKey: ["editor", editor.id] })]);
  const [form, setForm] = useState({ display_name: editor.display_name, headline: editor.headline, bio: editor.bio, styles: editor.styles as VideoStyle[], available: editor.available });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("editor_profiles").update(form).eq("id", editor.id);
      if (error) throw error;
      await refresh(); toast.success("Vitrine enregistrée");
    } catch (e) { toast.error(errorMessage(e)); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <Panel title="Ma vitrine">
        <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); void save(); }}>
          <div className="grid gap-2"><Label htmlFor="sf-name">Nom affiché</Label><Input id="sf-name" maxLength={80} value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} /></div>
          <div className="grid gap-2"><Label htmlFor="sf-headline">Accroche</Label><Input id="sf-headline" maxLength={140} value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} /></div>
          <div className="grid gap-2"><Label htmlFor="sf-bio">Bio</Label><Textarea id="sf-bio" rows={5} maxLength={1500} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
          <fieldset className="grid gap-2"><legend className="mb-2 text-sm font-medium">Styles</legend>
            <div className="flex flex-wrap gap-2">{STYLES.map((s) => { const on = form.styles.includes(s.value); return (
              <button key={s.value} type="button" aria-pressed={on} onClick={() => setForm({ ...form, styles: on ? form.styles.filter((x) => x !== s.value) : [...form.styles, s.value] })}
                className={cn("rounded-full border px-3 py-1 text-sm", on ? "border-primary bg-primary text-primary-foreground" : "border-border")}>{s.emoji} {s.label}</button>); })}</div>
          </fieldset>
          <div className="flex items-center gap-3"><Switch id="sf-av" checked={form.available} onCheckedChange={(v) => setForm({ ...form, available: v })} /><Label htmlFor="sf-av">Disponible pour de nouvelles commandes</Label></div>
          <Button type="submit" variant="hero" disabled={saving} className="justify-self-start">{saving ? "Enregistrement…" : "Enregistrer la vitrine"}</Button>
        </form>
      </Panel>
      <MediaManager editorId={editor.id} portfolio={portfolio} userId={userId} onChange={refresh} />
    </div>
  );
}

function MediaManager({ editorId, portfolio, userId, onChange }: { editorId: string; portfolio: StudioData["portfolio"]; userId: string; onChange: () => Promise<unknown> }) {
  const [title, setTitle] = useState("");
  const [style, setStyle] = useState<VideoStyle>("vlog");
  const [duration, setDuration] = useState<DurationCategory>("under_30");
  const [busy, setBusy] = useState(false);
  const full = portfolio.length >= 3;

  const upload = async (files: File[]) => {
    const video = files.find((f) => f.type.startsWith("video/"));
    const image = files.find((f) => f.type.startsWith("image/"));
    if (!video && !image) { toast.error("Déposez une image ou une vidéo."); return; }
    if (video && video.size > MAX_VIDEO_BYTES) { toast.error("Vidéo trop lourde (500 Mo max)."); return; }
    setBusy(true);
    try {
      let video_path: string | null = null; let poster_url: string | null = null;
      if (video) {
        video_path = `${userId}/${crypto.randomUUID()}.${fileExt(video)}`;
        const { error } = await supabase.storage.from("portfolio").upload(video_path, video, { contentType: video.type });
        if (error) throw error;
      }
      if (image) {
        const p = `${userId}/${crypto.randomUUID()}.${fileExt(image)}`;
        const { error } = await supabase.storage.from("previews").upload(p, image, { contentType: image.type });
        if (error) throw error;
        poster_url = PREVIEW_PREFIX + p;
      }
      const { error } = await supabase.from("portfolio_videos").insert({ editor_id: editorId, title: title.trim() || (video ?? image)!.name.replace(/\.[^.]+$/, ""), style, duration_category: duration, video_path, poster_url, position: portfolio.length });
      if (error) throw error;
      setTitle(""); await onChange(); toast.success("Média ajouté à votre vitrine");
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };

  const remove = async (v: StudioData["portfolio"][number]) => {
    if (!confirm("Supprimer ce média ?")) return;
    const { error } = await supabase.from("portfolio_videos").delete().eq("id", v.id);
    if (error) { toast.error(errorMessage(error)); return; }
    if (v.video_path) await supabase.storage.from("portfolio").remove([v.video_path]);
    await onChange(); toast.success("Média supprimé");
  };

  return (
    <Panel title={`Images et vidéos (${portfolio.length}/3)`}>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2"><Label htmlFor="m-title">Titre</Label><Input id="m-title" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. Montage gaming" /></div>
        <div className="grid gap-2"><Label htmlFor="m-style">Style</Label><select id="m-style" className={sel} value={style} onChange={(e) => setStyle(e.target.value as VideoStyle)}>{STYLES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
        <div className="grid gap-2"><Label htmlFor="m-dur">Durée</Label><select id="m-dur" className={sel} value={duration} onChange={(e) => setDuration(e.target.value as DurationCategory)}>{DURATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}</select></div>
      </div>
      <div className="mt-4">
        <Dropzone accept="image/*,video/*" multiple disabled={busy || full} onFiles={(f) => void upload(f)}
          label={full ? "3 médias maximum atteints" : busy ? "Envoi en cours…" : "Glissez une image ou une vidéo ici"}
          hint="Vidéo (500 Mo max) et/ou image de couverture (10 Mo max). Déposez les deux ensemble pour une vidéo avec couverture." />
      </div>
      {portfolio.length > 0 && <div className="mt-6 grid gap-6 sm:grid-cols-3">{portfolio.map((v) => (
        <div key={v.id} className="space-y-2">
          <VerticalPlayer src={v.src} poster={v.poster_url} title={v.title} duration={v.duration_category} style={v.style} />
          <Button variant="outline" size="sm" className="w-full" onClick={() => void remove(v)}><Trash2 /> Supprimer</Button>
        </div>))}</div>}
    </Panel>
  );
}
