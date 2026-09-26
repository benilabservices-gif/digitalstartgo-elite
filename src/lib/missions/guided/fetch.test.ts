import { describe, it, expect } from "vitest";
import { replacePromptVariables } from "./fetch";

describe("replacePromptVariables", () => {
  it("remplace une variable simple par la réponse actuelle", () => {
    const prompt = "Votre offre : {{offre}}";
    const reponses = { offre: "Coaching nutrition" };
    expect(replacePromptVariables(prompt, reponses)).toBe("Votre offre : Coaching nutrition");
  });

  it("retourne [à compléter] quand la variable manque", () => {
    const prompt = "Votre offre : {{offre}}";
    const reponses: Record<string, string | string[]> = {};
    expect(replacePromptVariables(prompt, reponses)).toBe("Votre offre : [à compléter]");
  });

  it("joint un tableau avec des puces", () => {
    const prompt = "Vos éléments : {{elements}}";
    const reponses = { elements: ["Item A", "Item B"] };
    expect(replacePromptVariables(prompt, reponses)).toBe("Vos éléments : Item A\n• Item B");
  });

  it("utilise les réponses validées d'une autre mission pour {{code.champ}}", () => {
    const prompt = "Résume la promesse de 2.1 : {{2.1.promesse}}";
    const reponses = { pompe: "actuelle" };
    const promptVariableMap = {
      "2.1": { promesse: "Transformez votre activité en 90 jours" },
    };
    expect(replacePromptVariables(prompt, reponses, promptVariableMap)).toBe(
      "Résume la promesse de 2.1 : Transformez votre activité en 90 jours"
    );
  });

  it("retourne [à compléter] pour une variable d'une autre mission absente", () => {
    const prompt = "{{2.1.promesse}}";
    const reponses: Record<string, string | string[]> = {};
    const promptVariableMap = {};
    expect(replacePromptVariables(prompt, reponses, promptVariableMap)).toBe("[à compléter]");
  });

  it("retourne [à compléter] pour une variable d'une autre mission dont le code n'existe pas dans la map", () => {
    const prompt = "{{9.9.mani}}";
    const reponses: Record<string, string | string[]> = {};
    const promptVariableMap = { "2.1": { promesse: "test" } };
    expect(replacePromptVariables(prompt, reponses, promptVariableMap)).toBe("[à compléter]");
  });

  it("mélange variables actuelles et cross-mission", () => {
    const prompt = "Avec {{titre}} et la promesse {{2.1.promesse}}";
    const reponses = { titre: "Ma mission" };
    const promptVariableMap = {
      "2.1": { promesse: "Promesse validée" },
    };
    expect(replacePromptVariables(prompt, reponses, promptVariableMap)).toBe(
      "Avec Ma mission et la promesse Promesse validée"
    );
  });
});
