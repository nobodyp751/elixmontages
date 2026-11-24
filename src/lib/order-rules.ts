import type { OrderStatus } from "./elix";
import { splitAmount } from "./commission";

export type OrderRole = "creator" | "editor" | "admin";
export type OrderAction = "pay" | "cancel" | "deliver" | "validate" | "revise" | "dispute" | "review" | "resolve";

/** Who may do what at each stage. The database enforces the same rules; this drives the UI. */
const RULES: Record<OrderAction, { roles: OrderRole[]; statuses: OrderStatus[] }> = {
  pay: { roles: ["creator"], statuses: ["pending_payment"] },
  cancel: { roles: ["creator"], statuses: ["pending_payment"] },
  deliver: { roles: ["editor"], statuses: ["in_progress", "revision_requested"] },
  validate: { roles: ["creator"], statuses: ["delivered"] },
  revise: { roles: ["creator"], statuses: ["delivered"] },
  dispute: { roles: ["creator", "editor"], statuses: ["in_progress", "delivered", "revision_requested"] },
  review: { roles: ["creator"], statuses: ["completed"] },
  resolve: { roles: ["admin"], statuses: ["disputed"] },
};

export function canDo(action: OrderAction, role: OrderRole, status: OrderStatus): boolean {
  const rule = RULES[action];
  return rule.roles.includes(role) && rule.statuses.includes(status);
}

/** Included revisions are free; every revision beyond them is billed at the offer's extra price. */
export function revisionInfo(o: { included_revisions: number; revisions_used: number; extra_revision_cents: number }) {
  const remaining = Math.max(0, o.included_revisions - o.revisions_used);
  const nextIsPaid = o.revisions_used >= o.included_revisions;
  return { remaining, nextIsPaid, nextCostCents: nextIsPaid ? o.extra_revision_cents : 0 };
}

/** Total paid by the creator (offer + paid revisions) and its 15 % / 85 % split. */
export function orderTotals(o: { amount_cents: number; extras_cents: number }) {
  const total = o.amount_cents + o.extras_cents;
  const { commission, editor } = splitAmount(total);
  return { total, commission, editor };
}

export const FINISHED_STATUSES: OrderStatus[] = ["completed", "refunded", "cancelled"];
