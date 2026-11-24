import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AlertCircle, Clapperboard, Clock, Lock, PackageCheck, Search, Shield, Sparkles, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageError, PageHeader, PageLoading, Panel, StatCard } from "@/components/elix/app-ui";
import { OrderRow } from "@/components/elix/order-row";
import { useAuth } from "@/hooks/use-auth";
import { creatorOrdersQuery } from "@/lib/app-queries";
import { ESCROW_STATUSES, formatEuros } from "@/lib/elix";
import { FINISHED_STATUSES, orderTotals } from "@/lib/order-rules";
import { cn } from "@/lib/utils";

type Tab = "en-cours" | "terminees" | "toutes";
const TABS: { value: Tab; label: string }[] = [
  { value: "en-cours", label: "En cours" },
  { value: "terminees", label: "Terminées" },
  { value: "toutes", label: "Toutes" },
];

export const Route = createFileRoute("/_authenticated/dashboard")({
  validateSearch: (s: Record<string, unknown>): { tab?: Tab } => {
    const t = s["tab"];
    return t === "en-cours" || t === "terminees" || t === "toutes" ? { tab: t } : {};
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(creatorOrdersQuery(context.user.id)),
  head: () => ({
    meta: [
      { title: "Tableau de bord créateur — Elix" },
      { name: "description", content: "Suivez vos commandes de montage, l'argent en séquestre et les livraisons à valider." },
      { property: "og:title", content: "Tableau de bord créateur — Elix" },
      { property: "og:description", content: "Toutes vos commandes de montage vidéo au même endroit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  pendingComponent: PageLoading,
  errorComponent: ({ error }) => <PageError error={error} />,
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const { tab = "en-cours" } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data: orders } = useSuspenseQuery(creatorOrdersQuery(user.id));
  const { profile, editor, isAdmin } = useAuth();
  const firstName = (profile?.display_name || user.email).split(" ")[0];

  const active = orders.filter((o) => o.status === "in_progress" || o.status === "revision_requested");
  const toValidate = orders.filter((o) => o.status === "delivered");
  const toPay = orders.filter((o) => o.status === "pending_payment");
  const escrow = orders.filter((o) => ESCROW_STATUSES.includes(o.status)).reduce((s, o) => s + orderTotals(o).total, 0);
  const spent = orders.filter((o) => o.status === "completed").reduce((s, o) => s + orderTotals(o).total, 0);

  const shown = orders.filter((o) =>
    tab === "toutes" ? true : tab === "terminees" ? FINISHED_STATUSES.includes(o.status) : !FINISHED_STATUSES.includes(o.status),
  );
  const isEditorAccount = profile?.account_type === "editor" || !!editor;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader
        eyebrow="Espace créateur"
        title={`Salut ${firstName} 👋`}
        description="Vos commandes de montage, l'argent bloqué en séquestre et les vidéos à valider."
        actions={
          <Button asChild variant="hero">
            <Link to="/monteurs">
              <Search /> Trouver un monteur
            </Link>
          </Button>
        }
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="En cours de montage" value={active.length} icon={Clock} tone="primary" />
        <StatCard label="Livraisons à valider" value={toValidate.length} icon={PackageCheck} tone={toValidate.length ? "info" : "default"} />
        <StatCard label="En séquestre" value={formatEuros(escrow)} icon={Lock} hint="Versé au monteur seulement après votre validation" />
        <StatCard label="Total investi" value={formatEuros(spent)} icon={Wallet} hint="Commandes validées" />
      </div>

      {(toValidate.length > 0 || toPay.length > 0) && (
        <Panel title="À faire maintenant" className="mt-8 border-primary/30">
          <ul className="space-y-2">
            {toValidate.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-info/10 p-4">
                <span className="flex items-center gap-2 text-sm">
                  <PackageCheck className="h-4 w-4 text-info" />
                  <strong>{o.title}</strong> a été livrée — vérifiez puis validez ou demandez une retouche.
                </span>
                <Button asChild size="sm">
                  <Link to="/commandes/$id" params={{ id: o.id }}>Voir la livraison</Link>
                </Button>
              </li>
            ))}
            {toPay.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-warning/10 p-4">
                <span className="flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-warning" />
                  <strong>{o.title}</strong> attend votre paiement pour démarrer.
                </span>
                <Button asChild size="sm" variant="outline">
                  <Link to="/commandes/$id" params={{ id: o.id }}>Payer</Link>
                </Button>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
        <Panel
          title="Mes commandes"
          actions={
            <div className="flex gap-1 rounded-full bg-secondary p-1">
              {TABS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => void navigate({ search: { tab: t.value } })}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    tab === t.value ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          }
        >
          {shown.length ? (
            <div className="space-y-2">
              {shown.map((o) => (
                <OrderRow
                  key={o.id}
                  id={o.id}
                  title={o.title}
                  status={o.status}
                  amountCents={orderTotals(o).total}
                  createdAt={o.created_at}
                  person={o.editor}
                  personLabel="Monteur :"
                  kind={o.kind}
                  videosCount={o.videos_count}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Sparkles}
              title={orders.length ? "Rien dans cette liste" : "Aucune commande pour l'instant"}
              text={orders.length ? undefined : "Choisissez un monteur, envoyez vos rushs : il commence dès que le paiement est en séquestre."}
              action={
                !orders.length && (
                  <Button asChild variant="hero">
                    <Link to="/monteurs">Parcourir les monteurs</Link>
                  </Button>
                )
              }
            />
          )}
        </Panel>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-5">
            <Clapperboard className="h-6 w-6 text-primary" />
            <p className="mt-3 font-semibold">{isEditorAccount ? "Votre studio monteur" : "Vous montez aussi ?"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isEditorAccount
                ? "Gérez votre vitrine, vos offres et les commandes reçues."
                : "Créez une vitrine de monteur et recevez des commandes payées d'avance."}
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link to="/studio">{isEditorAccount ? "Ouvrir mon studio" : "Créer ma vitrine"}</Link>
            </Button>
          </div>
          {isAdmin && (
            <div className="rounded-3xl border border-accent/30 bg-accent/10 p-5">
              <Shield className="h-6 w-6 text-accent" />
              <p className="mt-3 font-semibold">Espace fondateur</p>
              <p className="mt-1 text-sm text-muted-foreground">Commandes, commissions, versements et litiges.</p>
              <Button asChild variant="coral" size="sm" className="mt-4">
                <Link to="/admin">Ouvrir</Link>
              </Button>
            </div>
          )}
          <div className="rounded-3xl border border-border p-5 text-sm text-muted-foreground">
            <Lock className="h-5 w-5 text-primary" />
            <p className="mt-3 font-semibold text-foreground">Comment marche le séquestre</p>
            <p className="mt-1">
              Votre paiement est bloqué par Elix. Le monteur n'est payé que lorsque vous validez la vidéo. En cas de
              problème, ouvrez un litige depuis la commande.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
