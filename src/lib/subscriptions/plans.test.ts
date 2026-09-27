import { describe, it, expect } from "vitest";
import { formatXof, PLANS } from "./plans";

describe("formatXof", () => {
  it("insère un espace entre les milliers", () => {
    expect(formatXof(99900)).toBe("99 900 FCFA");
  });

  it("fonctionne sur un montant à 6 chiffres", () => () => {
    expect(formatXof(249900)).toBe("249 900 FCFA");
  });

  it("ne casse pas sur un petit montant", () => {
    expect(formatXof(500)).toBe("500 FCFA");
  });

  it("formate 349 900 FCFA", () => {
    expect(formatXof(349900)).toBe("349 900 FCFA");
  });
});

describe("PLANS", () => {
  it("expose les 3 paliers avec les nouveaux prix", () => {
    expect(PLANS.starter.amountXof).toBe(149900);
    expect(PLANS.pro.amountXof).toBe(249900);
    expect(PLANS.elite.amountXof).toBe(349900);
  });

  it("expose les avantages pour chaque palier", () => {
    expect(PLANS.starter.avantages.length).toBeGreaterThan(0);
    expect(PLANS.pro.avantages.length).toBeGreaterThan(0);
    expect(PLANS.elite.avantages.length).toBeGreaterThan(0);
  });

  it("mentionne le tunnel premium pour Elite", () => {
    const eliteAvantages = PLANS.elite.avantages.join(" ");
    expect(eliteAvantages).toContain("tunnel de vente premium");
  });

  it("expose engagementMois: 3 pour tous les paliers", () => {
    expect(PLANS.starter.engagementMois).toBe(3);
    expect(PLANS.pro.engagementMois).toBe(3);
    expect(PLANS.elite.engagementMois).toBe(3);
  });

  it("expose prixTroisMoisXof pour chaque palier", () => {
    expect(PLANS.starter.prixTroisMoisXof).toBe(425000);
    expect(PLANS.pro.prixTroisMoisXof).toBe(710000);
    expect(PLANS.elite.prixTroisMoisXof).toBe(995000);
  });

  it("calcule correctement l'économie", () => {
    const starterEconomie = 3 * PLANS.starter.amountXof - PLANS.starter.prixTroisMoisXof;
    expect(starterEconomie).toBe(24700);

    const proEconomie = 3 * PLANS.pro.amountXof - PLANS.pro.prixTroisMoisXof;
    expect(proEconomie).toBe(39700);

    const eliteEconomie = 3 * PLANS.elite.amountXof - PLANS.elite.prixTroisMoisXof;
    expect(eliteEconomie).toBe(54700);
  });
});
