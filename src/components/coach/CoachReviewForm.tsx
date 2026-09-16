"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
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

    // Le statut de mission_progress est mis à jour par un trigger côté base
    // (sync_mission_progress_from_submission) : rien à répercuter ici.
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-dark">Votre décision</legend>
        <label className="flex items-center gap-2 text-sm text-dark">
          <input
            type="radio"
            name="decision"
            value="valide"
            checked={decision === "valide"}
            onChange={() => setDecision("valide")}
          />
          Valider la mission
        </label>
        <label className="flex items-center gap-2 text-sm text-dark">
          <input
            type="radio"
            name="decision"
            value="a_corriger"
            checked={decision === "a_corriger"}
            onChange={() => setDecision("a_corriger")}
          />
          Demander une correction
        </label>
      </fieldset>

      <label className="text-sm font-medium text-dark" htmlFor="feedback">
        Feedback {decision === "a_corriger" ? "(obligatoire)" : "(facultatif)"}
        <textarea
          id="feedback"
          rows={5}
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          placeholder="Ce qui va, ce qui doit être repris, et la prochaine action concrète."
          className="mt-1 w-full rounded-lg border border-dark/10 px-3 py-2 text-sm"
        />
      </label>
      {fieldError && <p className="text-sm text-error">{fieldError}</p>}
      {submitError && <p className="text-sm text-error">{submitError}</p>}

      <div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Enregistrement..." : "Envoyer ma revue"}
        </Button>
      </div>
    </form>
  );
}
