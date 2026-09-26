import { createClient } from "@/lib/supabase/client";
import type { MissionData } from "./types";

export async function fetchMission(missionId: string): Promise<MissionData | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("missions")
    .select("*")
    .eq("id", missionId)
    .maybeSingle();

  if (error || !data) return null;

  return buildMissionData(data);
}

export async function fetchMissionByCode(code: string): Promise<MissionData | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("missions")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error || !data) return null;

  return buildMissionData(data);
}

function buildMissionData(data: any): MissionData {
  return {
    id: data.id,
    code: data.code ?? String(data.number),
    number: data.number,
    active: data.active ?? true,
    ordre: data.ordre ?? 1,
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

/**
 * Remplace les variables {{code.champ}} dans un prompt par les réponses du participant.
 * Si une variable référence une autre mission (ex: {{2.1.promesse}}), utilise
 * promptVariableMap pour récupérer les réponses validées de cette mission.
 */
export function replacePromptVariables(
  prompt: string,
  reponses: Record<string, string | string[]>,
  promptVariableMap: Record<string, Record<string, string | string[]>> = {}
): string {
  return prompt.replace(/\{\{([^}]+)\}\}/g, (_match, varName) => {
    const parts = varName.split(".");
    if (parts.length >= 2) {
      const missionCode = parts[0];
      const cle = parts[parts.length - 1];
      const missionReponses = promptVariableMap[missionCode];
      if (missionReponses) {
        const val = missionReponses[cle];
        if (val === undefined) return "[à compléter]";
        if (Array.isArray(val)) return val.join("\n• ");
        return String(val);
      }
    }
    // Variable sans code de mission → cherche dans les réponses actuelles
    const cle = parts[parts.length - 1];
    const val = reponses[cle];
    if (val === undefined) return "[à compléter]";
    if (Array.isArray(val)) return val.join("\n• ");
    return String(val);
  });
}
