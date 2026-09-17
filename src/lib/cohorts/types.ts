export type CohortStatus = "a_venir" | "en_cours" | "terminee";

export interface CohortRow {
  id: string;
  name: string;
  slug: string;
  starts_at: string;
  ends_at: string;
}

export interface ProfileForAssignment {
  id: string;
  business_name: string | null;
  full_name: string | null;
  role: "participant" | "coach" | "admin";
  cohort_id: string | null;
}
