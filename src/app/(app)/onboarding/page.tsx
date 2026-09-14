"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validateOnboardingProfile, type OnboardingProfileInput } from "@/lib/onboarding/validation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const GOALS = [
  "Vendre une formation",
  "Vendre un produit digital",
  "Vendre du coaching",
  "Développer mon service",
  "Générer des prospects",
  "Structurer mon activité",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [goal, setGoal] = useState(GOALS[0]);
  const [form, setForm] = useState<Partial<OnboardingProfileInput>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function updateField<K extends keyof OnboardingProfileInput>(key: K, value: OnboardingProfileInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validateOnboardingProfile(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setSubmitError(null);
    setSubmitting(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      business_name: form.businessName,
      activity: form.activity,
      target_audience: form.targetAudience,
      main_offer: form.mainOffer,
      price: form.price,
      current_audience_size: form.currentAudienceSize,
      main_channel: form.mainChannel,
      monthly_goal_fcfa: form.monthlyGoalFcfa,
      onboarding_completed: true,
    });

    setSubmitting(false);

    if (error) {
      setSubmitError(
        "Une erreur est survenue lors de l'enregistrement de votre profil. Vos réponses n'ont pas été perdues, réessayez."
      );
      return;
    }

    router.push("/diagnostic");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <p className="text-sm font-semibold uppercase tracking-widest text-royal">
        Bienvenue dans Virtuose Funnel
      </p>
      <h1 className="mb-8 text-3xl font-extrabold text-dark">Parlez-nous de votre activité</h1>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="text-sm font-medium text-dark">
            Votre objectif
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="mt-1 w-full rounded-lg border border-dark/10 px-3 py-2"
            >
              {GOALS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          {(
            [
              ["businessName", "Nom de l'activité"],
              ["activity", "Activité"],
              ["targetAudience", "Cible"],
              ["mainOffer", "Offre principale"],
              ["mainChannel", "Canal principal"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="text-sm font-medium text-dark">
              {label}
              <input
                type="text"
                value={(form[key] as string) ?? ""}
                onChange={(e) => updateField(key, e.target.value)}
                className="mt-1 w-full rounded-lg border border-dark/10 px-3 py-2"
              />
              {errors[key] && <p className="mt-1 text-sm text-error">{errors[key]}</p>}
            </label>
          ))}

          <label className="text-sm font-medium text-dark">
            Prix de votre offre (FCFA)
            <input
              type="number"
              value={form.price ?? ""}
              onChange={(e) => updateField("price", Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-dark/10 px-3 py-2"
            />
            {errors.price && <p className="mt-1 text-sm text-error">{errors.price}</p>}
          </label>

          <label className="text-sm font-medium text-dark">
            Taille de votre audience actuelle
            <input
              type="number"
              value={form.currentAudienceSize ?? ""}
              onChange={(e) => updateField("currentAudienceSize", Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-dark/10 px-3 py-2"
            />
            {errors.currentAudienceSize && (
              <p className="mt-1 text-sm text-error">{errors.currentAudienceSize}</p>
            )}
          </label>

          <label className="text-sm font-medium text-dark">
            Objectif mensuel (FCFA)
            <input
              type="number"
              value={form.monthlyGoalFcfa ?? ""}
              onChange={(e) => updateField("monthlyGoalFcfa", Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-dark/10 px-3 py-2"
            />
            {errors.monthlyGoalFcfa && (
              <p className="mt-1 text-sm text-error">{errors.monthlyGoalFcfa}</p>
            )}
          </label>

          {submitError && <p className="text-sm text-error">{submitError}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Enregistrement..." : "Continuer vers mon diagnostic"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
