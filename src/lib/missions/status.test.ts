import { describe, it, expect } from "vitest";
import {
  MISSION_STATUSES,
  SUBMISSION_MAX_LENGTH,
  canSubmitMission,
  submissionBlockedReason,
  toMissionStatus,
  validateCoachReview,
  validateSubmissionContent,
} from "./status";

describe("canSubmitMission", () => {
  it("autorise la soumission tant que la mission n'est ni soumise ni validée", () => {
    expect(canSubmitMission("a_faire")).toBe(true);
    expect(canSubmitMission("en_cours")).toBe(true);
    expect(canSubmitMission("a_corriger")).toBe(true);
  });

  it("interdit une nouvelle soumission quand une revue est en cours ou terminée", () => {
    expect(canSubmitMission("soumis")).toBe(false);
    expect(canSubmitMission("valide")).toBe(false);
  });

  it("couvre tous les statuts existants", () => {
    for (const status of MISSION_STATUSES) {
      expect(typeof canSubmitMission(status)).toBe("boolean");
    }
  });
});

describe("submissionBlockedReason", () => {
  it("explique pourquoi une mission validée ne peut plus être soumise", () => {
    expect(submissionBlockedReason("valide")).toContain("validée");
  });

  it("explique l'attente de revue pour une mission soumise", () => {
    expect(submissionBlockedReason("soumis")).toContain("revue");
  });

  it("ne retourne aucune raison quand la soumission est possible", () => {
    expect(submissionBlockedReason("a_faire")).toBeNull();
    expect(submissionBlockedReason("a_corriger")).toBeNull();
  });
});

describe("toMissionStatus", () => {
  it("conserve un statut connu", () => {
    expect(toMissionStatus("a_corriger")).toBe("a_corriger");
  });

  it("retombe sur 'a_faire' pour une valeur absente ou inconnue", () => {
    expect(toMissionStatus(undefined)).toBe("a_faire");
    expect(toMissionStatus(null)).toBe("a_faire");
    expect(toMissionStatus("statut_inconnu")).toBe("a_faire");
  });
});

describe("validateSubmissionContent", () => {
  it("accepte un lien ou une description", () => {
    expect(validateSubmissionContent("https://drive.google.com/mon-offre")).toBeNull();
  });

  it("refuse un contenu vide ou composé d'espaces", () => {
    expect(validateSubmissionContent("   ")).toBe(
      "Décrivez votre livrable ou collez son lien avant de soumettre."
    );
  });

  it("refuse un contenu trop long", () => {
    const trop = "a".repeat(SUBMISSION_MAX_LENGTH + 1);
    expect(validateSubmissionContent(trop)).toContain(String(SUBMISSION_MAX_LENGTH));
  });

  it("accepte un contenu exactement à la limite", () => {
    expect(validateSubmissionContent("a".repeat(SUBMISSION_MAX_LENGTH))).toBeNull();
  });
});

describe("validateCoachReview", () => {
  it("exige un feedback pour une demande de correction", () => {
    const errors = validateCoachReview({ decision: "a_corriger", feedback: "  " });
    expect(errors.feedback).toBe(
      "Expliquez ce qui doit être corrigé avant de renvoyer la mission."
    );
  });

  it("accepte une demande de correction accompagnée d'un feedback", () => {
    expect(validateCoachReview({ decision: "a_corriger", feedback: "Précise ton offre." })).toEqual({});
  });

  it("n'exige pas de feedback pour une validation", () => {
    expect(validateCoachReview({ decision: "valide", feedback: "" })).toEqual({});
  });
});
