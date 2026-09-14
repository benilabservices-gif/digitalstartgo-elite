export type DiagnosticCategory =
  | "offre"
  | "positionnement"
  | "audience"
  | "acquisition"
  | "captureDeLeads"
  | "funnel"
  | "conversion"
  | "relance"
  | "analytics";

export type DiagnosticAnswers = Record<DiagnosticCategory, number>;

export interface DiagnosticResult {
  score: number;
  priorities: string[];
}

export const DIAGNOSTIC_CATEGORIES: { id: DiagnosticCategory; label: string }[] = [
  { id: "offre", label: "Votre offre" },
  { id: "positionnement", label: "Votre positionnement" },
  { id: "audience", label: "Votre audience" },
  { id: "acquisition", label: "Votre acquisition" },
  { id: "captureDeLeads", label: "Votre capture de leads" },
  { id: "funnel", label: "Votre funnel" },
  { id: "conversion", label: "Votre conversion" },
  { id: "relance", label: "Votre relance" },
  { id: "analytics", label: "Vos analytics" },
];

const PRIORITY_MESSAGES: Record<DiagnosticCategory, string> = {
  offre: "Clarifier votre promesse",
  positionnement: "Clarifier votre positionnement",
  audience: "Mieux définir votre audience cible",
  acquisition: "Structurer votre acquisition de trafic",
  captureDeLeads: "Créer un lead magnet qui capture vos prospects",
  funnel: "Construire un funnel complet de bout en bout",
  conversion: "Améliorer votre page de vente pour convertir",
  relance: "Mettre en place une séquence de relance",
  analytics: "Suivre vos métriques pour piloter vos décisions",
};

export function computeDiagnosticResult(answers: DiagnosticAnswers): DiagnosticResult {
  const entries = DIAGNOSTIC_CATEGORIES.map(({ id }) => ({ id, value: answers[id] }));
  const total = entries.reduce((sum, entry) => sum + entry.value, 0);
  const maxTotal = entries.length * 10;
  const score = Math.round((total / maxTotal) * 100);

  const priorities = [...entries]
    .sort((a, b) => a.value - b.value)
    .slice(0, 3)
    .map((entry) => PRIORITY_MESSAGES[entry.id]);

  return { score, priorities };
}
