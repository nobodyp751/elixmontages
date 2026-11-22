/** Elix keeps a 15% service fee on every order; the editor receives the rest. */
export const COMMISSION_RATE = 0.15;

export function splitAmount(totalCents: number): { commission: number; editor: number } {
  const commission = Math.round(totalCents * COMMISSION_RATE);
  return { commission, editor: totalCents - commission };
}
