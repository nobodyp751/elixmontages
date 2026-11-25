import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { PageError, PageHeader, PageLoading, StatCard } from "@/components/elix/app-ui";
import { adminQuery } from "@/lib/app-queries";
import { formatEuros } from "@/lib/elix";

export const Route = createFileRoute("/_authenticated/admin")({
  loader: ({ context }) => context.queryClient.ensureQueryData(adminQuery(context.user.id)),
  head: () => ({ meta: [{ title: "Espace fondateur — Elix" }, { name: "description", content: "Commandes, commissions et litiges." }, { property: "og:title", content: "Espace fondateur — Elix" }, { property: "og:description", content: "Pilotage d'Elix." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  pendingComponent: PageLoading,
  errorComponent: ({ error }) => <PageError error={error} />,
  component: Admin,
});

function Admin() {
  const { user } = Route.useRouteContext();
  const { data } = useSuspenseQuery(adminQuery(user.id));
  if (!data.allowed) return <PageError error={new Error("Accès réservé au fondateur.")} />;
  const done = data.orders.filter((o) => o.status === "completed");
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader eyebrow="Espace fondateur" title="Pilotage" />
      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <StatCard label="Commandes" value={data.orders.length} />
        <StatCard label="Commissions acquises" value={formatEuros(done.reduce((s, o) => s + o.commission_cents, 0))} />
        <StatCard label="Litiges ouverts" value={data.orders.filter((o) => o.status === "disputed").length} />
        <StatCard label="Comptes" value={data.accounts.total} />
      </div>
    </div>
  );
}
