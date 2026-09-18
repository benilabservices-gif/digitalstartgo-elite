import type { CohortStatus } from "./types";

export function deriveCohortStatus(startsAt: string, endsAt: string, today: Date = new Date()): CohortStatus {
  const start = new Date(`${startsAt}T00:00:00`);
  const end = new Date(`${endsAt}T23:59:59`);

  if (today < start) return "a_venir";
  if (today > end) return "terminee";
  return "en_cours";
}
