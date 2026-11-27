import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { StudioData } from "@/lib/app-queries";
import { errorMessage, formatEuros, type OfferKind } from "@/lib/elix";
import { EmptyState, Panel } from "./app-ui";

type Offer = StudioData["offers"][number];
type Draft = { id?: string; kind: OfferKind; title: string; description: string; price: string; videos_count: string; included_revisions: string; extra_revision: string; delivery_days: string; active: boolean };
const blank: Draft = { kind: "unit", title: "", description: "", price: "50", videos_count: "1", included_revisions: "2", extra_revision: "10", delivery_days: "3", active: true };
const toDraft = (o: Offer): Draft => ({ id: o.id, kind: o.kind, title: o.title, description: o.description, price: String(o.price_cents / 100), videos_count: String(o.videos_count), included_revisions: String(o.included_revisions), extra_revision: String(o.extra_revision_cents / 100), delivery_days: String(o.delivery_days), active: o.active });

export function OffersEditor({ editorId, offers, userId }: { editorId: string; offers: Offer[]; userId: string }) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ["studio", userId] }), qc.invalidateQueries({ queryKey: ["editors"] }), qc.invalidateQueries({ queryKey: ["editor", editorId] })]);

  const save = async (d: Draft) => {
    const price = Math.round(Number(d.price) * 100);
    const count = d.kind === "unit" ? 1 : Math.max(2, Math.round(Number(d.videos_count)));
    if (!d.title.trim()) { toast.error("Donnez un titre à l'offre."); return; }
    if (!(price >= 500)) { toast.error("Prix minimum : 5 €."); return; }
    setBusy(true);
    try {
      const row = { editor_id: editorId, kind: d.kind, title: d.title.trim(), description: d.description.trim(), price_cents: price, videos_count: count,
        included_revisions: Math.max(0, Math.round(Number(d.included_revisions) || 0)), extra_revision_cents: Math.max(0, Math.round(Number(d.extra_revision) * 100) || 0),
        delivery_days: Math.max(1, Math.round(Number(d.delivery_days) || 1)), active: d.active };
      const { error } = d.id ? await supabase.from("offers").update(row).eq("id", d.id) : await supabase.from("offers").insert(row);
      if (error) throw error;
      setDraft(null); await refresh(); toast.success("Offre enregistrée");
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };
  const remove = async (o: Offer) => {
    if (!confirm(`Supprimer « ${o.title} » ?`)) return;
    const { error } = await supabase.from("offers").delete().eq("id", o.id);
    if (error) { toast.error("Cette offre a déjà des commandes : désactivez-la plutôt."); return; }
    await refresh(); toast.success("Offre supprimée");
  };

  return (
    <Panel title="Mes offres" actions={!draft && <Button variant="hero" size="sm" onClick={() => setDraft(blank)}><Plus /> Nouvelle offre</Button>}>
      {draft && <OfferForm draft={draft} setDraft={setDraft} busy={busy} onSave={() => void save(draft)} />}
      {offers.length ? <div className="mt-4 space-y-2">{offers.map((o) => (
        <div key={o.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border p-4">
          <div className="min-w-0">
            <p className="truncate font-semibold">{o.title} {!o.active && <span className="text-xs text-muted-foreground">(inactive)</span>}</p>
            <p className="text-sm text-muted-foreground">{o.kind === "pack" ? `Pack ${o.videos_count} vidéos` : "Vidéo à l'unité"} · {formatEuros(o.price_cents)} · {o.included_revisions} retouches · {o.delivery_days} j</p>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button variant="ghost" size="icon" aria-label="Modifier" onClick={() => setDraft(toDraft(o))}><Pencil /></Button>
            <Button variant="ghost" size="icon" aria-label="Supprimer" onClick={() => void remove(o)}><Trash2 /></Button>
          </div>
        </div>))}</div> : !draft && <EmptyState title="Aucune offre" text="Créez une vidéo à l'unité ou un pack mensuel." />}
    </Panel>
  );
}

function OfferForm({ draft, setDraft, busy, onSave }: { draft: Draft; setDraft: (d: Draft | null) => void; busy: boolean; onSave: () => void }) {
  const f = (k: keyof Draft) => (e: { target: { value: string } }) => setDraft({ ...draft, [k]: e.target.value });
  return (
    <form className="grid gap-4 rounded-2xl border border-primary/30 p-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); onSave(); }}>
      <div className="grid gap-2 sm:col-span-2"><Label>Type</Label><div className="flex gap-2">
        {(["unit", "pack"] as const).map((k) => <Button key={k} type="button" variant={draft.kind === k ? "hero" : "outline"} size="sm" onClick={() => setDraft({ ...draft, kind: k, videos_count: k === "unit" ? "1" : "10" })}>{k === "unit" ? "À l'unité" : "Pack mensuel"}</Button>)}
      </div></div>
      <div className="grid gap-2 sm:col-span-2"><Label htmlFor="o-title">Titre</Label><Input id="o-title" maxLength={100} value={draft.title} onChange={f("title")} /></div>
      <div className="grid gap-2 sm:col-span-2"><Label htmlFor="o-desc">Description</Label><Textarea id="o-desc" rows={3} maxLength={1000} value={draft.description} onChange={f("description")} /></div>
      <div className="grid gap-2"><Label htmlFor="o-price">Prix (€)</Label><Input id="o-price" type="number" min={5} step="1" value={draft.price} onChange={f("price")} /></div>
      {draft.kind === "pack" && <div className="grid gap-2"><Label htmlFor="o-count">Vidéos par mois</Label><Input id="o-count" type="number" min={2} value={draft.videos_count} onChange={f("videos_count")} /></div>}
      <div className="grid gap-2"><Label htmlFor="o-rev">Retouches incluses</Label><Input id="o-rev" type="number" min={0} value={draft.included_revisions} onChange={f("included_revisions")} /></div>
      <div className="grid gap-2"><Label htmlFor="o-extra">Retouche supplémentaire (€)</Label><Input id="o-extra" type="number" min={0} value={draft.extra_revision} onChange={f("extra_revision")} /></div>
      <div className="grid gap-2"><Label htmlFor="o-days">Délai (jours)</Label><Input id="o-days" type="number" min={1} value={draft.delivery_days} onChange={f("delivery_days")} /></div>
      <div className="flex items-center gap-3 sm:col-span-2"><Switch id="o-active" checked={draft.active} onCheckedChange={(v) => setDraft({ ...draft, active: v })} /><Label htmlFor="o-active">Offre visible sur la vitrine</Label></div>
      <div className="flex gap-2 sm:col-span-2"><Button type="submit" variant="hero" disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer l'offre"}</Button><Button type="button" variant="ghost" onClick={() => setDraft(null)}>Annuler</Button></div>
    </form>
  );
}
