"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  DIAGNOSTIC_CATEGORIES,
  computeDiagnosticResult,
  type DiagnosticAnswers,
  type DiagnosticResult,
} from "@/lib/diagnostic/scoring";
import { Button } from "@/components/ui/Button";
import { PremiumCard } from "@/components/app-ui/PremiumCard";

const DEFAULT_ANSWERS: DiagnosticAnswers = DIAGNOSTIC_CATEGORIES.reduce(
  (acc, { id }) => ({ ...acc, [id]: 5 }),
  {} as DiagnosticAnswers
);

export default function DiagnosticPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<DiagnosticAnswers>(DEFAULT_ANSWERS);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaving(true);

    const computed = computeDiagnosticResult(answers);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      setSaveError("Une erreur est survenue. Votre score n'a pas pu être enregistré. Réessayez.");
      return;
    }

    const { error } = await supabase.from("diagnostics").insert({
      profile_id: user.id,
      answers,
      score: computed.score,
      priorities: computed.priorities,
    });

    setSaving(false);

    if (error) {
      setSaveError("Une erreur est survenue. Votre score n'a pas pu être enregistré. Réessayez.");
      return;
    }

    setResult(computed);
  }

  if (result) {
    const scoreColor =
      result.score >= 70 ? "text-success" : result.score >= 40 ? "text-ochre" : "text-error";

    return (
      <div className="mx-auto max-w-xl px-6 py-10">
        <PremiumCard glow className="text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-ochre">
            Votre Funnel Score
          </p>
          <p className={`my-4 t-chiffre text-7xl leading-none ${scoreColor}`}>
            {result.score}<span className="t-meta text-2xl text-secondary">/100</span>
          </p>
          <div className="my-6 h-2 w-full overflow-hidden rounded-full bg-dark/8">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                result.score >= 70 ? "bg-success" : result.score >= 40 ? "bg-ochre" : "bg-error"
              }`}
              style={{ width: `${result.score}%` }}
            />
          </div>
          <PremiumCard title="Vos 3 priorités" className="mt-6 text-left">
            <ol className="list-decimal space-y-2 pl-5 text-dark">
              {result.priorities.map((priority) => (
                <li key={priority} className="text-[0.9375rem]">{priority}</li>
              ))}
            </ol>
          </PremiumCard>
          <Button className="mt-6 w-full" onClick={() => router.push("/dashboard")}>
            Commencer mon plan d&apos;action
          </Button>
        </PremiumCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-ochre">Diagnostic</p>
      <h1 className="t-display-mid mb-8 text-[clamp(1.5rem,4vw,2rem)] text-dark">
        Évaluez votre système de vente
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {DIAGNOSTIC_CATEGORIES.map(({ id, label }) => (
          <PremiumCard key={id} className="py-4">
            <div className="mb-3 flex items-center justify-between">
              <label htmlFor={id} className="text-sm font-semibold text-dark">
                {label}
              </label>
              <span className="t-chiffre text-lg text-ochre">{answers[id]}</span>
            </div>
            <input
              id={id}
              type="range"
              min={0}
              max={10}
              value={answers[id]}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [id]: Number(e.target.value) }))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-dark/10 accent-gold"
            />
            <div className="mt-1 flex justify-between text-[0.625rem] text-secondary/60">
              <span>À construire</span>
              <span>Maîtrisé</span>
            </div>
          </PremiumCard>
        ))}

        <Button type="submit" disabled={saving} className="mt-2 w-full">
          {saving ? "Calcul en cours..." : "Obtenir mon Funnel Score"}
        </Button>
        {saveError && <p className="text-sm text-error">{saveError}</p>}
      </form>
    </div>
  );
}
