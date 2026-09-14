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
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";

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
    return (
      <div className="mx-auto max-w-xl px-6 py-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-royal">Votre Funnel Score</p>
        <p className="my-4 text-6xl font-extrabold text-navy">{result.score}/100</p>
        <Card title="Vos 3 priorités">
          <ol className="list-decimal space-y-2 pl-5 text-left text-dark">
            {result.priorities.map((priority) => (
              <li key={priority}>{priority}</li>
            ))}
          </ol>
        </Card>
        <Button className="mt-6" onClick={() => router.push("/dashboard")}>
          Commencer mon plan d&apos;action
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-2 text-3xl font-extrabold text-dark">Diagnostic funnel</h1>
      <p className="mb-8 text-secondary">
        Évaluez chaque catégorie de 0 (à construire) à 10 (déjà maîtrisée).
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {DIAGNOSTIC_CATEGORIES.map(({ id, label }) => (
          <div key={id}>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor={id} className="text-sm font-medium text-dark">
                {label}
              </label>
              <span className="text-sm font-semibold text-royal">{answers[id]}/10</span>
            </div>
            <input
              id={id}
              type="range"
              min={0}
              max={10}
              value={answers[id]}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, [id]: Number(e.target.value) }))
              }
              className="w-full"
            />
          </div>
        ))}
        <Button type="submit" disabled={saving}>
          {saving ? "Calcul en cours..." : "Obtenir mon Funnel Score"}
        </Button>
        {saveError && <p className="text-sm text-error">{saveError}</p>}
      </form>
    </div>
  );
}
