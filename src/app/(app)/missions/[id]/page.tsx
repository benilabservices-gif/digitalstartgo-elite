import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isStageValidated, getNextMissionId } from "@/lib/missions/stage-lock";
import MissionContent from "./MissionContent";
import type { MissionData } from "@/lib/missions/guided/types";

interface LockState {
  locked: boolean;
  reason: string | null;
  linkHref: string | null;
}

interface PromptVariableMap {
  [missionCode: string]: Record<string, string | string[]>;
}

async function fetchMissionRaw(supabase: any, id: string) {
  const { data, error } = await supabase
    .from("missions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return buildMissionData(data);
}

async function fetchMissionByCodeRaw(supabase: any, code: string) {
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

export default async function MissionPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch mission by code first (e.g. "1.1"), then by id as fallback
  let mission: MissionData | null = await fetchMissionByCodeRaw(supabase, params.id);
  if (!mission) {
    mission = await fetchMissionRaw(supabase, params.id);
  }

  if (!mission) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="text-lg font-semibold text-error">Mission introuvable</p>
        <a href="/dashboard" className="mt-4 inline-block text-sm text-ochre hover:underline">
          ← Retour au dashboard
        </a>
      </div>
    );
  }

  // Fetch all stages with their missions for lock checks
  const { data: stages } = await supabase
    .from("stages")
    .select("id, number, title, missions(id, code, number, order_index, title, objective, estimated_duration_minutes, ordre, active, pourquoi, exemple_avant, exemple_apres, champs, criteres, guide_outil, prompts_ia, bonus_elite)")
    .order("order_index");

  // Fetch user's progress for all missions
  const { data: progressRows } = await supabase
    .from("mission_progress")
    .select("mission_id, status")
    .eq("profile_id", user.id);

  const progressMap = new Map<string, string>((progressRows ?? []).map((r: any) => [r.mission_id, r.status]));

  // Find this mission's stage
  const missionStage = (stages ?? []).find((s: any) =>
    s.missions?.some((m: any) => m.id === mission!.id || m.code === mission!.code)
  );

  let lockState: LockState = { locked: false, reason: null, linkHref: null };

  // Rule: mission inactive → blocked
  if (mission.active === false) {
    lockState = { locked: true, reason: null, linkHref: "/dashboard" };
  }

  // Rule: previous stage not validated → locked
  if (!lockState.locked && missionStage) {
    const stageNumber = missionStage.number;
    const previousStage = (stages ?? []).find((s: any) => s.number === stageNumber - 1);

    if (previousStage) {
      const prevMissions = previousStage.missions ?? [];
      if (!isStageValidated(prevMissions, progressMap)) {
        const nextPrevMissionId = getNextMissionId(prevMissions, progressMap);
        lockState = {
          locked: true,
          reason: `Étape ${String(previousStage.number).padStart(2, "0")} — ${previousStage.title}`,
          linkHref: nextPrevMissionId ? `/missions/${nextPrevMissionId}` : `/dashboard`,
        };
      }
    }
  }

  // Rule: same-stage mission with lower ordre not validated → blocked
  if (!lockState.locked && missionStage && missionStage.missions) {
    const sortedMissions = [...missionStage.missions].sort((a: any, b: any) => (a.ordre ?? 0) - (b.ordre ?? 0));
    const currentOrdre = mission.ordre ?? 0;
    for (const m of sortedMissions) {
      if ((m.ordre ?? 0) < currentOrdre && m.active !== false && progressMap.get(m.id) !== "valide") {
        lockState = {
          locked: true,
          reason: `Terminez d'abord la mission ${m.code ?? `#${m.number}`}`,
          linkHref: `/missions/${m.code ?? m.id}`,
        };
        break;
      }
    }
  }

  // Check Elite subscription for bonus_elite
  let isElite = false;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "admin" || profile?.role === "coach") {
    isElite = true;
  } else {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("profile_id", user.id)
      .gt("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (sub?.plan === "elite") {
      isElite = true;
    }
  }

  // Fetch validated submissions for prompt variables
  const promptVariableMap: PromptVariableMap = {};
  if (mission.prompts_ia) {
    const missionCodes = new Set<string>();
    for (const p of mission.prompts_ia) {
      const match = p.prompt.match(/\{\{(\d+\.\d+)\.[^}]+\}\}/g);
      if (match) {
        for (const m of match) {
          const code = m.replace(/\{\{([^.]+)\..+\}\}/, "$1");
          missionCodes.add(code);
        }
      }
    }
    for (const code of missionCodes) {
      const refMission = await fetchMissionByCodeRaw(supabase, code);
      if (refMission) {
        const { data: refProgress } = await supabase
          .from("mission_progress")
          .select("id")
          .eq("mission_id", refMission.id)
          .eq("profile_id", user.id)
          .maybeSingle();
        if (refProgress?.id) {
          const { data: refSub } = await supabase
            .from("mission_submissions")
            .select("reponses")
            .eq("mission_progress_id", refProgress.id)
            .eq("statut", "valide")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (refSub?.reponses) {
            promptVariableMap[code] = refSub.reponses as Record<string, string | string[]>;
          }
        }
      }
    }
  }

  return (
    <MissionContent
      mission={mission}
      user={user}
      lockState={lockState}
      progressMap={progressMap}
      isElite={isElite}
      promptVariableMap={promptVariableMap}
    />
  );
}
