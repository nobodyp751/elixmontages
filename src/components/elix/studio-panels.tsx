import { EmptyState, Panel, StatCard } from "./app-ui";
import { OrderRow } from "./order-row";
import type { EditorOrder, StudioData } from "@/lib/app-queries";
import { formatEuros } from "@/lib/elix";
import { PortfolioProtection } from "./portfolio-protection";
import { StorefrontEditor } from "./storefront-editor";
import { OffersEditor } from "./offers-editor";

export function StorefrontPanel(props: { editor: StudioData["editor"]; portfolio: StudioData["portfolio"]; userId: string }) {
  return <StorefrontEditor {...props} />;
}
export function PortfolioPanel({ portfolio }: { editorId: string; portfolio: StudioData["portfolio"]; userId: string }) {
  return <PortfolioProtection portfolio={portfolio} />;
}
export function OffersPanel(props: { editorId: string; offers: StudioData["offers"]; userId: string }) {
  return <OffersEditor {...props} />;
}
export function ReceivedOrdersPanel({ orders }: { orders: EditorOrder[] }) {
  return (
    <Panel title="Commandes reçues">
      {orders.length ? <div className="space-y-2">{orders.map((o) => (
        <OrderRow key={o.id} id={o.id} title={o.title} status={o.status} amountCents={o.editor_amount_cents} amountLabel="Votre part" createdAt={o.created_at} person={o.creator} personLabel="Créateur :" kind={o.kind} videosCount={o.videos_count} />
      ))}</div> : <EmptyState title="Aucune commande reçue" />}
    </Panel>
  );
}
export function EarningsPanel({ orders }: { orders: EditorOrder[] }) {
  const sum = (f: (o: EditorOrder) => boolean) => orders.filter(f).reduce((s, o) => s + o.editor_amount_cents, 0);
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard label="En séquestre" value={formatEuros(sum((o) => ["in_progress", "delivered", "revision_requested", "disputed"].includes(o.status)))} />
      <StatCard label="À recevoir" value={formatEuros(sum((o) => o.payout_status === "to_release"))} />
      <StatCard label="Versé" value={formatEuros(sum((o) => o.payout_status === "paid"))} />
    </div>
  );
}
