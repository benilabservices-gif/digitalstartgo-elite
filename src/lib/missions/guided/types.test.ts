import { describe, it, expect } from "vitest";
import { formatContenu } from "./types";
import type { MissionChamp } from "./types";

describe("formatContenu", () => {
  const champs: MissionChamp[] = [
    { cle: "offre", libelle: "Votre offre", type: "texte_long", obligatoire: true },
    { cle: "ventes", libelle: "Ventes", type: "nombre", obligatoire: true },
    { cle: "options", libelle: "Options", type: "liste", obligatoire: false, max_lignes: 5 },
  ];

  it("formate un champ texte simple", () => {
    const reponses = { offre: "Coaching nutrition" };
    expect(formatContenu(champs, reponses)).toBe("Votre offre : Coaching nutrition");
  });

  it("formate un champ liste en puces", () => {
    const reponses = { options: ["Option A", "Option B"] };
    expect(formatContenu(champs, reponses)).toContain("Option A");
    expect(formatContenu(champs, reponses)).toContain("Option B");
    expect(formatContenu(champs, reponses)).toMatch(/•/);
  });

  it("ignore les champs vides", () => {
    const reponses = { offre: "Test" };
    const result = formatContenu(champs, reponses);
    expect(result).not.toContain("Ventes");
    expect(result).not.toContain("Options");
  });

  it("tronque à 4000 caractères", () => {
    const longText = "x".repeat(5000);
    const reponses = { offre: longText };
    const result = formatContenu(champs, reponses);
    expect(result.length).toBeLessThanOrEqual(4000);
  });

  it("gère un objet reponses vide", () => {
    expect(formatContenu(champs, {})).toBe("");
  });
});
