import { describe, it, expect } from "vitest";
import { computeDiagnosticResult, type DiagnosticAnswers } from "./scoring";

const fullMarks: DiagnosticAnswers = {
  offre: 10,
  positionnement: 10,
  audience: 10,
  acquisition: 10,
  captureDeLeads: 10,
  funnel: 10,
  conversion: 10,
  relance: 10,
  analytics: 10,
};

describe("computeDiagnosticResult", () => {
  it("retourne un score de 100 quand toutes les catégories sont à 10", () => {
    expect(computeDiagnosticResult(fullMarks).score).toBe(100);
  });

  it("retourne un score de 0 quand toutes les catégories sont à 0", () => {
    const zero = Object.fromEntries(
      Object.keys(fullMarks).map((key) => [key, 0])
    ) as DiagnosticAnswers;
    expect(computeDiagnosticResult(zero).score).toBe(0);
  });

  it("identifie les 3 catégories les plus faibles comme priorités", () => {
    const answers: DiagnosticAnswers = {
      ...fullMarks,
      captureDeLeads: 1,
      relance: 2,
      positionnement: 3,
    };
    const result = computeDiagnosticResult(answers);
    expect(result.priorities).toEqual([
      "Créer un lead magnet qui capture vos prospects",
      "Mettre en place une séquence de relance",
      "Clarifier votre positionnement",
    ]);
  });

  it("calcule correctement le score avec les points du diagnostic 1.1", () => {
    // Simulation d'un participant avec des réponses réalistes
    const answers: DiagnosticAnswers = {
      offre: 5,
      positionnement: 3,
      audience: 6,
      acquisition: 4,
      captureDeLeads: 2,
      funnel: 0,
      conversion: 1,
      relance: 1,
      analytics: 0,
    };
    const result = computeDiagnosticResult(answers);
    // Total = 5+3+6+4+2+0+1+1+0 = 22, max = 90, score = round(22/90*100) = 24
    expect(result.score).toBe(24);
    expect(result.priorities.length).toBe(3);
  });
});
