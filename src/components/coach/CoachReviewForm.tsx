"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { PremiumCard } from "@/components/app-ui/PremiumCard";
import { validateCoachReview, type CoachDecision } from "@/lib/missions/status";

interface CoachReviewFormProps {
  submissionId: string;
}

export function CoachReviewForm({ submissionId }: CoachReviewFormProps) {
  const router = useRouter();
  const [decision, setDecision] = useState<CoachDecision>("valide");
  const [feedback, setFeedback] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const errors = validateCoachReview({ decision, feedback });
    if (errors.feedback) {
      setFieldError(errors.feedback);
      return;
    }

    setFieldError(null);
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

    const trimmedFeedback = feedback.trim();

    const { error } = await supabase
      .from("mission_submissions")
      .update({
        statut: decision,
        feedback_coach: trimmedFeedback.length > 0 ? trimmedFeedback : null,
        corrige_par: user.id,
      })
      .eq("id", submissionId);

    setSubmitting(false);

    if (error) {
      setSubmitError("La revue n'a pas pu être enregistrée. Réessayez dans un instant.");
      return;
    }

    router.push("/coach");
    router.refresh();
  }

  return (
    <PremiumCard title="Votre revue" className="!p-0">
      <form onSubmit={handleSubmit} className="p-6">
        <fieldset className="mb-5 flex flex-col gap-3">
          <legend className="mb-1 text-sm font-semibold text-dark">Votre décision</legend>
          <label className="flex cursor-pointer items-center gap-3 rounded-[2px] border border-dark/8 px-4 py-3 transition-colors hover:border-ochre/30 has-[:checked]:border-gold/50 has-[:checked]:bg-gold/5">
            <input
              type="radio"
              name="decision"
              value="valide"
              checked={decision === "valide"}
              onChange={() => setDecision("valide")}
              className="accent-gold h-4 w-4"
            />
            <div>
              <span className="block font-semibold text-dark">Valider la mission</span>
              <span className="text-xs text-secondary">Le livrable est conforme, la mission est validée.</span>
            </div>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-[2px] border border-dark/8 px-4 py-3 transition-colors hover:border-error/30 has-[:checked]:border-error/50 has-[:checked]:bg-error/5">
            <input
              type="radio"
              name="decision"
              value="a_corriger"
              checked={decision === "a_corriger"}
              onChange={() => setDecision("a_corriger")}
              className="accent-error h-4 w-4"
            />
            <div>
              <span className="block font-semibold text-dark">Demander une correction</span>
              <span className="text-xs text-secondary">Le livrable doit être amélioré avant validation.</span>
            </div>
          </label>
        </fieldset>

        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-semibold text-dark">
            Feedback {decision === "a_corriger" && <span className="text-error">*</span>}
          </label>
          <textarea
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            placeholder="Ce qui va, ce qui doit être repris, et la prochaine action concrète."
            rows={4}
            className="w-full rounded-[2px] border border-dark/12 bg-paper px-3 py-2.5 text-sm text-dark focus:border-gold/60 focus:outline-none"
          />
          {fieldError && <p className="mt-1 text-xs text-error">{fieldError}</p>}
        </div>

        {submitError && <p className="mb-4 text-sm text-error">{submitError}</p>}

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Enregistrement..." : "Envoyer ma revue"}
        </Button>
      </form>
    </PremiumCard>
  );
}
