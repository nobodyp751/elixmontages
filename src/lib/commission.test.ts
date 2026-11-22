import { describe, expect, it } from "vitest";
import { splitAmount } from "./commission";

describe("commission Elix", () => {
  it("sur une commande de 100 €, 85 € vont au monteur et 15 € à la plateforme", () => {
    expect(splitAmount(10000)).toEqual({ commission: 1500, editor: 8500 });
  });

  it("arrondit la commission au centime pour une vidéo à 45 €", () => {
    expect(splitAmount(4500)).toEqual({ commission: 675, editor: 3825 });
  });
});
