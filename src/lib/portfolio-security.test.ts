import { describe, expect, it } from "vitest";
import { DOWNLOAD_LINK_SECONDS, portfolioCodeSchema } from "./portfolio-security";

describe("codes de téléchargement du portfolio", () => {
  it("exige un code avant d’autoriser un téléchargement", () => {
    expect(portfolioCodeSchema.safeParse("").success).toBe(false);
    expect(portfolioCodeSchema.safeParse("Montage42").success).toBe(true);
  });
  it("refuse les codes courts ou sans lettre et chiffre", () => {
    for (const code of ["Abc1234", "abcdefgh", "12345678", "A1".repeat(33)]) {
      expect(portfolioCodeSchema.safeParse(code).success).toBe(false);
    }
  });
  it("limite le lien temporaire à une minute", () => {
    expect(DOWNLOAD_LINK_SECONDS).toBe(60);
  });
});