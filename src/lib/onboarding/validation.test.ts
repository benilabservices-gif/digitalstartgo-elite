import { describe, it, expect } from "vitest";
import { validateOnboardingProfile } from "./validation";

describe("validateOnboardingProfile", () => {
  it("ne retourne aucune erreur pour un profil complet et valide", () => {
    const errors = validateOnboardingProfile({
      businessName: "BeniLab",
      activity: "Coaching",
      targetAudience: "Entrepreneurs francophones",
      mainOffer: "Coaching individuel",
      price: 500000,
      currentAudienceSize: 1200,
      mainChannel: "Instagram",
      monthlyGoalFcfa: 1000000,
    });
    expect(errors).toEqual({});
  });

  it("signale les champs texte obligatoires manquants", () => {
    const errors = validateOnboardingProfile({ businessName: "  " });
    expect(errors.businessName).toBe("Le nom de l'activité est obligatoire.");
    expect(errors.activity).toBe("L'activité est obligatoire.");
  });

  it("signale un prix ou un objectif mensuel non positif", () => {
    const errors = validateOnboardingProfile({ price: 0, monthlyGoalFcfa: -100 });
    expect(errors.price).toBe("Le prix doit être supérieur à 0.");
    expect(errors.monthlyGoalFcfa).toBe("L'objectif mensuel doit être supérieur à 0.");
  });
});
