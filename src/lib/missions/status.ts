export const MISSION_STATUSES = ["a_faire", "en_cours", "soumis", "a_corriger", "valide"] as const;

export type MissionStatus = (typeof MISSION_STATUSES)[number];

/** Statuts que peut porter une soumission (sous-ensemble des statuts de mission). */
export const SUBMISSION_STATUSES = ["soumis", "a_corriger", "valide"] as const;

export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

/** Décision possible d'un coach face à une soumission en attente. */
export type CoachDecision = Extract<SubmissionStatus, "valide" | "a_corriger">;

export type StatusTone = "default" | "success" | "warning" | "error";

export const MISSION_STATUS_LABELS: Record<MissionStatus, string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  soumis: "Soumis",
  a_corriger: "À corriger",
  valide: "Validé",
};

export const MISSION_STATUS_TONE: Record<MissionStatus, StatusTone> = {
  a_faire: "default",
  en_cours: "warning",
  soumis: "warning",
  a_corriger: "error",
  valide: "success",
};

/** Statut affiché quand aucune ligne mission_progress n'existe encore. */
export const DEFAULT_MISSION_STATUS: MissionStatus = "a_faire";

export function isMissionStatus(value: unknown): value is MissionStatus {
  return typeof value === "string" && (MISSION_STATUSES as readonly string[]).includes(value);
}

/** Normalise une valeur venue de la base vers un statut connu. */
export function toMissionStatus(value: unknown): MissionStatus {
  return isMissionStatus(value) ? value : DEFAULT_MISSION_STATUS;
}

/**
 * Une mission validée est définitive, et une soumission déjà en attente de revue
 * ne doit pas être doublonnée tant que le coach n'a pas répondu.
 */
export function canSubmitMission(status: MissionStatus): boolean {
  return status === "a_faire" || status === "en_cours" || status === "a_corriger";
}

export function submissionBlockedReason(status: MissionStatus): string | null {
  if (status === "valide") {
    return "Cette mission est validée. Bravo, il n'y a plus rien à soumettre.";
  }
  if (status === "soumis") {
    return "Votre livrable est en attente de revue par un coach.";
  }
  return null;
}

export const SUBMISSION_MAX_LENGTH = 4000;

/** Valide le livrable saisi par le participant. Retourne le message d'erreur, ou null. */
export function validateSubmissionContent(contenu: string): string | null {
  const trimmed = contenu.trim();
  if (trimmed.length === 0) {
    return "Décrivez votre livrable ou collez son lien avant de soumettre.";
  }
  if (trimmed.length > SUBMISSION_MAX_LENGTH) {
    return `Votre livrable ne doit pas dépasser ${SUBMISSION_MAX_LENGTH} caractères.`;
  }
  return null;
}

export interface CoachReviewInput {
  decision: CoachDecision;
  feedback: string;
}

export type CoachReviewErrors = Partial<Record<"feedback", string>>;

/** Un refus sans explication n'aide pas le participant : le feedback est obligatoire. */
export function validateCoachReview(input: CoachReviewInput): CoachReviewErrors {
  if (input.decision === "a_corriger" && input.feedback.trim().length === 0) {
    return { feedback: "Expliquez ce qui doit être corrigé avant de renvoyer la mission." };
  }
  return {};
}
