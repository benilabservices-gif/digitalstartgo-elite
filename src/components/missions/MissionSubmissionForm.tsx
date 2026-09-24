"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { SUBMISSION_MAX_LENGTH, validateSubmissionContent } from "@/lib/missions/status";
import { CheckCircle2, Send, Loader2 } from "lucide-react";

interface MissionSubmissionFormProps {
  missionId: string;
  /** Progression déjà existante, ou null si le participant ouvre la mission pour la première fois. */
  missionProgressId: string | null;
  /** Vrai si une soumission précédente a été renvoyée pour correction. */
  isCorrection: boolean;
  /** Titre de la mission pour les messages de succès */
  missionTitle?: string;
}

export function MissionSubmissionForm({
  missionId,
  missionProgressId,
  isCorrection,
  missionTitle,
}: MissionSubmissionFormProps) {
  const router = useRouter();
  const [contenu, setContenu] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
    // sur la mission : on la crée au statut par défaut 'a_faire'.
    if (!progressId) {
      const { data: created } = await supabase
        .from("mission_progress")
        .insert({ profile_id: user.id, mission_id: missionId })
        .select("id")
        .single();

      if (created) {
        progressId = created.id as string;
      } else {
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
        "Votre livrable n'a pas pu être envoyé. Rafraîchissez la page puis réessayez — votre texte est toujours là."
      );
      return;
    }

    // Créer une notification pour le participant
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submitted",
          missionTitle: missionTitle ?? "Votre livrable",
        }),
      });
    } catch {
      // silencieux
    }

    setContenu("");
    setSubmitted(true);
    router.refresh();
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[2px] border border-success/30 bg-success/5 px-6 py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
          <CheckCircle2 className="h-7 w-7 text-success" />
        </div>
        <h3 className="t-display-mid text-xl text-dark">
          {isCorrection ? "Correction envoyée !" : "Livrable soumis avec succès !"}
        </h3>
        <p className="max-w-sm text-sm text-secondary">
          {isCorrection
            ? "Votre version corrigée a été envoyée à votre coach. Vous recevrez un feedback sous peu."
            : "Votre livrable a été envoyé à votre coach pour révision. Vous serez notifié dès qu'il aura répondu."}
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            router.refresh();
          }}
          className="mt-2 text-sm font-medium text-ochre hover:underline"
        >
          Retour aux missions
        </button>
      </div>
    );
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
        placeholder={
          isCorrection
            ? "Décrivez ici les corrections apportées ou collez le lien de votre version mise à jour."
            : "Collez le lien de votre livrable (Google Doc, Drive, page en ligne...) ou décrivez ce que vous avez produit."
        }
        className="w-full rounded-[2px] border border-dark/10 bg-paper px-3 py-2.5 text-sm text-dark placeholder:text-secondary/40 focus:border-gold/60 focus:outline-none resize-none"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-secondary/50">
          {contenu.length} / {SUBMISSION_MAX_LENGTH} caractères
        </span>
        {error && <span className="text-xs text-error">{error}</span>}
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Envoi en cours...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            {isCorrection ? "Renvoyer ma correction" : "Soumettre à mon coach"}
          </span>
        )}
      </Button>
    </form>
  );
}
