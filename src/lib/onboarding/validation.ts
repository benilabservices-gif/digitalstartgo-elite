export interface OnboardingProfileInput {
  businessName: string;
  activity: string;
  targetAudience: string;
  mainOffer: string;
  price: number;
  currentAudienceSize: number;
  mainChannel: string;
  monthlyGoalFcfa: number;
}

export type OnboardingValidationErrors = Partial<Record<keyof OnboardingProfileInput, string>>;

const REQUIRED_TEXT_FIELDS: {
  key: keyof OnboardingProfileInput;
  label: string;
}[] = [
  { key: "businessName", label: "Le nom de l'activité" },
  { key: "activity", label: "L'activité" },
  { key: "targetAudience", label: "La cible" },
  { key: "mainOffer", label: "L'offre principale" },
  { key: "mainChannel", label: "Le canal principal" },
];

export function validateOnboardingProfile(
  input: Partial<OnboardingProfileInput>
): OnboardingValidationErrors {
  const errors: OnboardingValidationErrors = {};

  for (const { key, label } of REQUIRED_TEXT_FIELDS) {
    const value = input[key];
    if (typeof value !== "string" || value.trim().length === 0) {
      errors[key] = `${label} est obligatoire.`;
    }
  }

  if (typeof input.price !== "number" || input.price <= 0) {
    errors.price = "Le prix doit être supérieur à 0.";
  }

  if (typeof input.currentAudienceSize !== "number" || input.currentAudienceSize < 0) {
    errors.currentAudienceSize = "L'audience actuelle ne peut pas être négative.";
  }

  if (typeof input.monthlyGoalFcfa !== "number" || input.monthlyGoalFcfa <= 0) {
    errors.monthlyGoalFcfa = "L'objectif mensuel doit être supérieur à 0.";
  }

  return errors;
}
