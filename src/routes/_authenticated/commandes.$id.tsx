import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { PageError, PageHeader, PageLoading, Panel } from "@/components/elix/app-ui";
import { StatusBadge } from "@/components/elix/status-badge";
import { orderQuery } from "@/lib/app-queries";
import { formatEuros } from "@/lib/elix";
import { orderTotals } from "@/lib/order-rules";

export const Route = createFileRoute("/_authenticated/commandes/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(orderQuery(params.id)),
  head: () => ({ meta: [{ title: "Commande — Elix" }, { name: "description", content: "Suivi de votre commande Elix." }, { property: "og:title", content: "Commande — Elix" }, { property: "og:description", content: "Suivi de commande." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  pendingComponent: PageLoading,
  errorComponent: ({ error }) => <PageError error={error} />,
  component: OrderPage,
});

function OrderPage() {
  const { id } = Route.useParams();
  const { data: o } = useSuspenseQuery(orderQuery(id));
  if (!o) return <PageError error={new Error("Commande introuvable")} />;
  const t = orderTotals(o);
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <PageHeader eyebrow="Commande" title={o.title} actions={<StatusBadge status={o.status} />} />
      <Panel title="Récapitulatif" className="mt-8">
        <p>Total : {formatEuros(t.total)} · Monteur : {formatEuros(t.editor)} · Elix : {formatEuros(t.commission)}</p>
        <p className="mt-2 text-sm text-muted-foreground">Retouches : {o.revisions_used}/{o.included_revisions}</p>
      </Panel>
    </div>
  );
}
