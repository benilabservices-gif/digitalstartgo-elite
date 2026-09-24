"use client";

import { useState, useEffect } from "react";
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
import { CheckCircle2, ArrowRight, RotateCcw } from "lucide-react";

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
  const [checking, setChecking] = useState(true);
  const [existingResult, setExistingResult] = useState<DiagnosticResult | null>(null);

  // Check if user already has a diagnostic result
  useEffect(() => {
    async function checkExisting() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setChecking(false);
      if (!user) return;

      const { data } = await supabase
        .from("diagnostics")
        .select("score, priorities, answers")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setExistingResult({
          score: data.score as number,
          priorities: (data.priorities as string[]) ?? [],
        });
      }
      setChecking(false);
    }
    checkExisting();
  }, []);

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

  async function retakeDiagnostic() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("diagnostics").delete().eq("profile_id", user.id);
    setExistingResult(null);
    setResult(null);
    setAnswers(DEFAULT_ANSWERS);
  }

  // Show existing result or new result
  const displayResult = result ?? existingResult;

  if (checking) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          <p className="text-sm text-secondary">Chargement de votre diagnostic…</p>
        </div>
      </div>
    );
  }

  if (displayResult) {
    const scoreColor =
      displayResult.score >= 70 ? "text-success" : displayResult.score >= 40 ? "text-ochre" : "text-error";

    return (
      <div className="mx-auto max-w-xl px-6 py-10">
        <PremiumCard glow className="text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-ochre">
            Votre Funnel Score
          </p>
          <p className={`my-4 t-chiffre text-7xl leading-none ${scoreColor}`}>
            {displayResult.score}<span className="t-meta text-2xl text-secondary">/100</span>
          </p>
          <div className="my-6 h-2 w-full overflow-hidden rounded-full bg-dark/8">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                displayResult.score >= 70 ? "bg-success" : displayResult.score >= 40 ? "bg-ochre" : "bg-error"
              }`}
              style={{ width: `${displayResult.score}%` }}
            />
          </div>

          <PremiumCard title="Vos 3 priorités" className="mt-6 text-left">
            <ol className="list-decimal space-y-2 pl-5 text-dark">
              {displayResult.priorities.map((priority, i) => (
                <li key={i} className="flex items-start gap-2 text-[0.9375rem]">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/20 text-[0.625rem] font-bold text-ochre">
                    {i + 1}
                  </span>
                  {priority}
                </li>
              ))}
            </ol>
          </PremiumCard>

          {/* Action principale : aller à l'étape 1 */}
          <div className="mt-6 flex flex-col gap-3">
            <Button
              className="w-full"
              onClick={() => router.push("/parcours/diagnostic")}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Commencer l&apos;étape 1 — Diagnostic
            </Button>
            <p className="text-center text-xs text-secondary">
              Votre premier livrable : valider votre diagnostic et définir votre plan d&apos;action.
            </p>
          </div>

          <button
            type="button"
            onClick={retakeDiagnostic}
            className="mt-4 flex items-center justify-center gap-2 w-full text-sm text-steel/60 hover:text-ochre transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Refaire le diagnostic
          </button>
        </PremiumCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-ochre">Diagnostic</p>
      <h1 className="t-display-mid mb-2 text-[clamp(1.5rem,4vw,2rem)] text-dark">
        Évaluez votre système de vente
      </h1>
      <p className="mb-8 text-[1.0625rem] text-secondary">
        Répondez à ces 9 questions pour obtenir votre Funnel Score et vos 3 priorités.
        Ce diagnostic prend environ 3 minutes.
      </p>

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
          {saving ? "Calcul en cours…" : "Obtenir mon Funnel Score"}
        </Button>
        {saveError && <p className="text-sm text-error">{saveError}</p>}
      </form>
    </div>
  );
}
