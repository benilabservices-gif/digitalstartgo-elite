"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validateOnboardingProfile, type OnboardingProfileInput } from "@/lib/onboarding/validation";
import { Button } from "@/components/ui/Button";
import { PremiumCard } from "@/components/app-ui/PremiumCard";

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
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-ochre">
        Bienvenue
      </p>
      <h1 className="t-display-mid mb-8 text-[clamp(1.5rem,4vw,2rem)] text-dark">
        Parlez-nous de votre activité
      </h1>

      <PremiumCard>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-dark">
              Votre objectif principal
            </label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full rounded-[2px] border border-dark/12 bg-paper px-3 py-2.5 text-sm text-dark focus:border-gold/60 focus:outline-none"
            >
              {GOALS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>

          {(
            [
              ["businessName", "Nom de l'activité"],
              ["activity", "Activité"],
              ["targetAudience", "Cible"],
              ["mainOffer", "Offre principale"],
              ["mainChannel", "Canal principal"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="mb-1.5 block text-sm font-semibold text-dark">{label}</label>
              <input
                type="text"
                value={(form[key] as string) ?? ""}
                onChange={(e) => updateField(key, e.target.value)}
                className="w-full rounded-[2px] border border-dark/12 bg-paper px-3 py-2.5 text-sm text-dark focus:border-gold/60 focus:outline-none"
              />
              {errors[key] && <p className="mt-1 text-xs text-error">{errors[key]}</p>}
            </div>
          ))}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-dark">Prix (FCFA)</label>
              <input
                type="number"
                value={form.price ?? ""}
                onChange={(e) => updateField("price", Number(e.target.value))}
                className="w-full rounded-[2px] border border-dark/12 bg-paper px-3 py-2.5 text-sm text-dark focus:border-gold/60 focus:outline-none"
              />
              {errors.price && <p className="mt-1 text-xs text-error">{errors.price}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-dark">Taille audience</label>
              <input
                type="number"
                value={form.currentAudienceSize ?? ""}
                onChange={(e) => updateField("currentAudienceSize", Number(e.target.value))}
                className="w-full rounded-[2px] border border-dark/12 bg-paper px-3 py-2.5 text-sm text-dark focus:border-gold/60 focus:outline-none"
              />
              {errors.currentAudienceSize && (
                <p className="mt-1 text-xs text-error">{errors.currentAudienceSize}</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-dark">Objectif mensuel (FCFA)</label>
            <input
              type="number"
              value={form.monthlyGoalFcfa ?? ""}
              onChange={(e) => updateField("monthlyGoalFcfa", Number(e.target.value))}
              className="w-full rounded-[2px] border border-dark/12 bg-paper px-3 py-2.5 text-sm text-dark focus:border-gold/60 focus:outline-none"
            />
            {errors.monthlyGoalFcfa && (
              <p className="mt-1 text-xs text-error">{errors.monthlyGoalFcfa}</p>
            )}
          </div>

          {submitError && <p className="text-sm text-error">{submitError}</p>}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Enregistrement..." : "Continuer vers mon diagnostic"}
          </Button>
        </form>
      </PremiumCard>
    </div>
  );
}
