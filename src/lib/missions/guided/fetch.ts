import { createClient } from "@/lib/supabase/server";
import type { MissionData } from "./types";

export async function fetchMission(missionId: string): Promise<MissionData | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("missions")
    .select("*")
    .eq("id", missionId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    code: data.code ?? String(data.number),
    number: data.number,
    title: data.title,
    objective: data.objective ?? "",
    estimated_duration_minutes: data.estimated_duration_minutes ?? 30,
    why: data.pourquoi ?? "",
    exemple_avant: data.exemple_avant ?? "",
    exemple_apres: data.exemple_apres ?? "",
    champs: data.champs ?? [],
    criteres: data.criteres ?? [],
    guide_outil: data.guide_outil ?? undefined,
    prompts_ia: data.prompts_ia ?? undefined,
    bonus_elite: data.bonus_elite ?? undefined,
  };
}

export async function fetchLastValidatedSubmission(missionId: string, profileId: string) {
  const supabase = createClient();
  const { data: progress } = await supabase
    .from("mission_progress")
    .select("id")
    .eq("mission_id", missionId)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!progress?.id) return null;

  const { data } = await supabase
    .from("mission_submissions")
    .select("reponses, statut")
    .eq("mission_progress_id", progress.id)
    .eq("statut", "valide")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}
