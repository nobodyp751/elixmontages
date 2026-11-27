import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle, Clapperboard, ExternalLink, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, PageError, PageHeader, PageLoading } from "@/components/elix/app-ui";
import { EarningsPanel, OffersPanel, PortfolioPanel, ReceivedOrdersPanel, StorefrontPanel } from "@/components/elix/studio-panels";
import { supabase } from "@/integrations/supabase/client";
import { editorOrdersQuery, studioQuery, type StudioData } from "@/lib/app-queries";
import { errorMessage } from "@/lib/elix";
import { useAuth } from "@/hooks/use-auth";

type Tab = "vitrine" | "portfolio" | "offres" | "commandes" | "revenus";
const TABS: { value: Tab; label: string }[] = [
  { value: "vitrine", label: "Vitrine" },
  { value: "portfolio", label: "Portfolio" },
  { value: "offres", label: "Offres" },
  { value: "commandes", label: "Commandes reçues" },
  { value: "revenus", label: "Revenus" },
];
const TAB_VALUES = TABS.map((t) => t.value) as string[];

export const Route = createFileRoute("/_authenticated/studio")({
  validateSearch: (s: Record<string, unknown>): { tab?: Tab } => {
    const t = s["tab"];
    return typeof t === "string" && TAB_VALUES.includes(t) ? { tab: t as Tab } : {};
  },
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(studioQuery(context.user.id)),
      context.queryClient.ensureQueryData(editorOrdersQuery(context.user.id)),
    ]),
  head: () => ({
    meta: [
      { title: "Studio monteur — Elix" },
      { name: "description", content: "Gérez votre vitrine, votre portfolio, vos offres et les commandes reçues sur Elix." },
      { property: "og:title", content: "Studio monteur — Elix" },
      { property: "og:description", content: "Votre espace monteur : vitrine, offres, commandes et revenus." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  pendingComponent: PageLoading,
  errorComponent: ({ error }) => <PageError error={error} />,
  component: Studio,
});

function Studio() {
  const { user } = Route.useRouteContext();
  const { data } = useSuspenseQuery(studioQuery(user.id));
  return data ? <StudioWorkspace data={data} /> : <CreateStorefront />;
}

function CreateStorefront() {
  const { user } = Route.useRouteContext();
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    try {
      const { error } = await supabase
        .from("editor_profiles")
        .insert({ user_id: user.id, display_name: profile?.display_name || user.email.split("@")[0] || "Monteur" });
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["studio", user.id] });
      await qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Votre vitrine est créée. Complétez-la puis publiez-la.");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <EmptyState
        icon={Clapperboard}
        title="Créez votre vitrine de monteur"
        text="Ajoutez une bio, jusqu'à 3 vidéos de portfolio et vos offres. Les créateurs vous paient d'avance, l'argent est bloqué en séquestre jusqu'à leur validation."
        action={
          <Button variant="hero" size="xl" onClick={() => void create()} disabled={busy}>
            {busy ? "Création…" : "Créer ma vitrine"}
          </Button>
        }
      />
    </div>
  );
}

function StudioWorkspace({ data }: { data: StudioData }) {
  const { user } = Route.useRouteContext();
  const { tab = "vitrine" } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data: orders } = useSuspenseQuery(editorOrdersQuery(user.id));
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const { editor, portfolio, offers } = data;

  const checklist = [
    { done: editor.bio.trim().length >= 30 && editor.headline.trim().length > 0, label: "Une accroche et une bio (30 caractères min.)" },
    { done: editor.styles.length > 0, label: "Au moins un style" },
    { done: portfolio.length > 0, label: "Au moins une vidéo de portfolio" },
    { done: offers.some((o) => o.active), label: "Au moins une offre active" },
  ];
  const ready = checklist.every((c) => c.done);
  const newOrders = orders.filter((o) => o.status === "in_progress" || o.status === "revision_requested").length;

  const togglePublish = async () => {
    if (!editor.published && !ready) {
      toast.error("Complétez la liste avant de publier votre vitrine.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.from("editor_profiles").update({ published: !editor.published }).eq("id", editor.id);
      if (error) throw error;
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["studio", user.id] }),
        qc.invalidateQueries({ queryKey: ["editors"] }),
        qc.invalidateQueries({ queryKey: ["editor", editor.id] }),
      ]);
      toast.success(editor.published ? "Vitrine retirée du catalogue" : "Vitrine publiée : les créateurs peuvent vous commander !");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader
        eyebrow="Studio monteur"
        title={editor.display_name || "Mon studio"}
        description={
          editor.published
            ? "Votre vitrine est en ligne dans le catalogue."
            : "Votre vitrine est en brouillon : seul vous la voyez."
        }
        actions={
          <>
            {editor.published && (
              <Button asChild variant="glass">
                <Link to="/monteurs/$id" params={{ id: editor.id }}>
                  <ExternalLink /> Voir ma vitrine
                </Link>
              </Button>
            )}
            <Button variant={editor.published ? "outline" : "hero"} onClick={() => void togglePublish()} disabled={busy}>
              {editor.published ? <EyeOff /> : <Eye />}
              {editor.published ? "Dépublier" : "Publier ma vitrine"}
            </Button>
          </>
        }
      />

      {!editor.published && (
        <div className="mt-6 grid gap-2 rounded-3xl border border-primary/30 bg-primary/5 p-5 sm:grid-cols-2">
          <p className="font-semibold sm:col-span-2">Avant de publier</p>
          {checklist.map((c) => (
            <p key={c.label} className="flex items-center gap-2 text-sm">
              {c.done ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
              <span className={c.done ? "text-muted-foreground line-through" : ""}>{c.label}</span>
            </p>
          ))}
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => void navigate({ search: { tab: v as Tab } })} className="mt-8">
        <TabsList className="h-auto flex-wrap justify-start">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
              {t.value === "commandes" && newOrders > 0 && (
                <span className="ml-1.5 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{newOrders}</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-6">
        {tab === "vitrine" && <StorefrontPanel editor={editor} portfolio={portfolio} userId={user.id} />}
        {tab === "portfolio" && <PortfolioPanel editorId={editor.id} portfolio={portfolio} userId={user.id} />}
        {tab === "offres" && <OffersPanel editorId={editor.id} offers={offers} userId={user.id} />}
        {tab === "commandes" && <ReceivedOrdersPanel orders={orders} />}
        {tab === "revenus" && <EarningsPanel orders={orders} />}
      </div>
    </div>
  );
}
