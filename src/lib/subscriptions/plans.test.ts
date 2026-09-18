import { describe, it, expect } from "vitest";
import { formatXof, PLANS } from "./plans";

describe("formatXof", () => {
  it("insère un espace entre les milliers", () => {
    expect(formatXof(99900)).toBe("99 900 FCFA");
  });

  it("fonctionne sur un montant à 6 chiffres", () => {
    expect(formatXof(249900)).toBe("249 900 FCFA");
  });

  it("ne casse pas sur un petit montant", () => {
    expect(formatXof(500)).toBe("500 FCFA");
  });
});

describe("PLANS", () => {
  it("expose les 3 paliers avec les prix publiés sur la landing page", () => {
    expect(PLANS.starter.amountXof).toBe(99900);
    expect(PLANS.pro.amountXof).toBe(149900);
    expect(PLANS.elite.amountXof).toBe(249900);
  });
});
