import { describe, expect, it } from "vitest";
import { canDo, orderTotals, revisionInfo } from "./order-rules";

describe("retouches", () => {
  it("la retouche suivante est gratuite tant qu'il reste des retouches incluses", () => {
    expect(revisionInfo({ included_revisions: 2, revisions_used: 1, extra_revision_cents: 1000 })).toEqual({
      remaining: 1,
      nextIsPaid: false,
      nextCostCents: 0,
    });
  });

  it("au-delà des retouches incluses, la retouche est facturée au prix de l'offre", () => {
    expect(revisionInfo({ included_revisions: 2, revisions_used: 2, extra_revision_cents: 1000 })).toEqual({
      remaining: 0,
      nextIsPaid: true,
      nextCostCents: 1000,
    });
  });
});

describe("montant d'une commande", () => {
  it("une commande de 100 € + 10 € de retouche donne 16,50 € à Elix et 93,50 € au monteur", () => {
    expect(orderTotals({ amount_cents: 10000, extras_cents: 1000 })).toEqual({ total: 11000, commission: 1650, editor: 9350 });
  });
});

describe("qui peut faire quoi", () => {
  it("seul le créateur valide une livraison", () => {
    expect(canDo("validate", "creator", "delivered")).toBe(true);
    expect(canDo("validate", "editor", "delivered")).toBe(false);
  });

  it("le créateur ne peut pas valider avant la livraison (argent en séquestre)", () => {
    expect(canDo("validate", "creator", "in_progress")).toBe(false);
  });

  it("seul le monteur livre, pendant le montage ou après une retouche", () => {
    expect(canDo("deliver", "editor", "in_progress")).toBe(true);
    expect(canDo("deliver", "editor", "revision_requested")).toBe(true);
    expect(canDo("deliver", "creator", "in_progress")).toBe(false);
  });

  it("seul le fondateur tranche un litige", () => {
    expect(canDo("resolve", "admin", "disputed")).toBe(true);
    expect(canDo("resolve", "creator", "disputed")).toBe(false);
  });

  it("la note n'est possible qu'après validation", () => {
    expect(canDo("review", "creator", "completed")).toBe(true);
    expect(canDo("review", "creator", "delivered")).toBe(false);
  });
});
