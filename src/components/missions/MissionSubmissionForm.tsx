"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { SUBMISSION_MAX_LENGTH, validateSubmissionContent } from "@/lib/missions/status";

interface MissionSubmissionFormProps {
  missionId: string;
  /** Progression déjà existante, ou null si le participant ouvre la mission pour la première fois. */
  missionProgressId: string | null;
  /** Vrai si une soumission précédente a été renvoyée pour correction. */
  isCorrection: boolean;
}

export function MissionSubmissionForm({
  missionId,
  missionProgressId,
  isCorrection,
}: MissionSubmissionFormProps) {
  const router = useRouter();
  const [contenu, setContenu] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const validationError = validateSubmissionContent(contenu);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSubmitting(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    let progressId = missionProgressId;

    // La ligne de progression n'existe pas tant que le participant n'a rien fait
    // sur la mission : on la crée au statut par défaut 'a_faire'. C'est ensuite
    // le trigger côté base qui la passera à 'soumis' à l'insertion de la
    // soumission — le participant n'a pas le droit d'écrire ce statut lui-même.
    if (!progressId) {
      const { data: created } = await supabase
        .from("mission_progress")
        .insert({ profile_id: user.id, mission_id: missionId })
        .select("id")
        .single();

      if (created) {
        progressId = created.id as string;
      } else {
        // Ligne déjà créée entre-temps (second onglet, double clic) : on la relit.
        const { data: existing } = await supabase
          .from("mission_progress")
          .select("id")
          .eq("profile_id", user.id)
          .eq("mission_id", missionId)
          .maybeSingle();

        if (!existing) {
          setSubmitting(false);
          setError("Impossible d'ouvrir cette mission. Réessayez dans un instant.");
          return;
        }
        progressId = existing.id as string;
      }
    }

    const { error: submissionError } = await supabase.from("mission_submissions").insert({
      mission_progress_id: progressId,
      contenu: contenu.trim(),
    });

    setSubmitting(false);

    if (submissionError) {
      setError(
        "Votre livrable n'a pas pu être envoyé. Vérifiez votre connexion et réessayez — votre texte est toujours là."
      );
      return;
    }

    setContenu("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="text-sm font-medium text-dark" htmlFor="livrable">
        {isCorrection ? "Votre livrable corrigé" : "Votre livrable"}
      </label>
      <textarea
        id="livrable"
        rows={5}
        value={contenu}
        maxLength={SUBMISSION_MAX_LENGTH}
        onChange={(event) => setContenu(event.target.value)}
        placeholder="Collez le lien de votre livrable (Google Doc, Drive, page en ligne...) ou décrivez ce que vous avez produit."
        className="w-full rounded-lg border border-dark/10 px-3 py-2 text-sm"
      />
      {error && <p className="text-sm text-error">{error}</p>}
      <div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Envoi en cours..." : "Soumettre à mon coach"}
        </Button>
      </div>
    </form>
  );
}
