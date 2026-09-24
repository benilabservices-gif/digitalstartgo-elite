import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PremiumCard, SectionHeading } from "@/components/app-ui/PremiumCard";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  MISSION_STATUS_LABELS,
  MISSION_STATUS_TONE,
  toMissionStatus,
  canSubmitMission,
} from "@/lib/missions/status";
import { formatDateTime } from "@/lib/missions/format";
import { CheckCircle2, Clock, Lock, Unlock, FileText, ArrowRight, ChevronRight } from "lucide-react";

interface StageRow {
  id: string;
  number: number;
  slug: string;
  title: string;
  objective: string;
  order_index: number;
  missions: {
    id: string;
    number: number;
    title: string;
    objective: string;
    estimated_duration_minutes: number;
  }[];
}

interface ProgressRow {
  mission_id: string;
  status: string;
}

interface SubmissionRow {
  statut: string;
  feedback_coach: string | null;
  created_at: string;
}

export default async function StagePage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed) redirect("/onboarding");

  const { data: stageData } = await supabase
    .from("stages")
    .select("id, number, slug, title, objective, order_index, missions(id, number, title, objective, estimated_duration_minutes)")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!stageData) notFound();

  const stage = stageData as unknown as StageRow;
  const stageNum = stage.number;

  // Check if ALL previous stages are fully validated (lock logic)
  const { data: prevStagesData } = await supabase
    .from("stages")
    .select("id, missions(id)")
    .lt("number", stageNum)
    .order("number", { ascending: true });

  const prevStages = (prevStagesData ?? []) as { id: string; missions: { id: string }[] }[];
  let isLocked = false;

  if (prevStages.length > 0) {
    // Get all progress for all previous stages at once
    const allPrevMissionIds = prevStages.flatMap((s) => s.missions.map((m) => m.id));
    const { data: prevProgress } = await supabase
      .from("mission_progress")
      .select("mission_id, status")
      .in("mission_id", allPrevMissionIds);

    const prevProgressMap = new Map<string, string>();
    (prevProgress ?? []).forEach((p: any) => prevProgressMap.set(p.mission_id, p.status));

    // Stage is locked if ANY previous mission is not validated
    isLocked = !allPrevMissionIds.every((mid) => prevProgressMap.get(mid) === "valide");
  }

  const { data: progressRows } = await supabase
    .from("mission_progress")
    .select("id, mission_id, status")
    .eq("profile_id", user.id);

  const progressByMission = new Map((progressRows ?? []).map((row: any) => [row.mission_id, row.status]));

  // Get submissions for each mission
  const submissionsByMission = new Map<string, SubmissionRow>();
  for (const mission of stage.missions) {
    const progressEntry = (progressRows ?? []).find((p: any) => p.mission_id === mission.id);
    const { data: subs } = await supabase
      .from("mission_submissions")
      .select("statut, feedback_coach, created_at")
      .eq("mission_progress_id", progressEntry?.id ?? "")
      .order("created_at", { ascending: false })
      .limit(1);
    if (subs?.[0]) {
      submissionsByMission.set(mission.id, subs[0] as SubmissionRow);
    }
  }

  // Check if this stage is the current one (not locked, not all completed)
  const allValidated = stage.missions.every((m) => progressByMission.get(m.id) === "valide");
  const hasAnyProgress = stage.missions.some((m) => progressByMission.has(m.id));

  // Find next stage
  const { data: nextStageData } = await supabase
    .from("stages")
    .select("slug, title")
    .gt("number", stageNum)
    .order("number")
    .limit(1);
  const nextStage = (nextStageData ?? [0])[0] as { slug: string; title: string } | null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 pb-24 sm:pb-10">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-secondary">
          <li>
            <Link href="/dashboard" className="hover:text-ochre">
              Mon Parcours
            </Link>
          </li>
          <li><ChevronRight className="h-3 w-3" /></li>
          <li className="text-ochre font-medium">Étape {String(stageNum).padStart(2, "0")}</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-ochre">
            Étape {String(stageNum).padStart(2, "0")} sur 8
          </p>
          <h1 className="t-display-mid text-[clamp(1.5rem,4vw,2.25rem)] text-dark">{stage.title}</h1>
          <p className="mt-2 max-w-xl text-[1.0625rem] text-secondary">{stage.objective}</p>
        </div>
        <div className="shrink-0">
          {isLocked ? (
            <div className="flex items-center gap-2 rounded-[2px] border border-dark/10 bg-paper px-4 py-2.5">
              <Lock className="h-4 w-4 text-secondary/50" />
              <span className="text-sm text-secondary">Verrouillé</span>
            </div>
          ) : allValidated ? (
            <div className="flex items-center gap-2 rounded-[2px] border border-success/30 bg-success/5 px-4 py-2.5">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-sm text-success">Validé</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-[2px] border border-gold/30 bg-gold/5 px-4 py-2.5">
              <Unlock className="h-4 w-4 text-gold" />
              <span className="text-sm text-ochre">En cours</span>
            </div>
          )}
        </div>
      </div>

      {/* Missions */}
      <div className="space-y-4">
        {stage.missions.map((mission, index) => {
          const status = toMissionStatus(progressByMission.get(mission.id));
          const submission = submissionsByMission.get(mission.id);
          const isCurrent = !isLocked && !allValidated && index === stage.missions.findIndex((m) => progressByMission.get(m.id) !== "valide");

          return (
            <PremiumCard
              key={mission.id}
              className={`transition-all ${isLocked ? "opacity-60" : ""} ${isCurrent ? "border-l-[3px] border-l-gold" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    status === "valide"
                      ? "bg-success/15 text-success"
                      : status === "a_corriger"
                      ? "bg-error/15 text-error"
                      : status === "soumis"
                      ? "bg-ochre/15 text-ochre"
                      : "bg-dark/10 text-secondary"
                  }`}>
                    {status === "valide" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : String(mission.number).padStart(2, "0")}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-dark">{mission.title}</h3>
                      <Badge tone={MISSION_STATUS_TONE[status]}>{MISSION_STATUS_LABELS[status]}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-secondary">{mission.objective}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-secondary">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        ~{mission.estimated_duration_minutes} min
                      </span>
                      {submission?.feedback_coach && (
                        <span className="flex items-center gap-1 text-ochre">
                          <FileText className="h-3 w-3" />
                          Feedback coach disponible
                        </span>
                      )}
                    </div>
                    {submission?.feedback_coach && (
                      <p className="mt-2 rounded-[2px] border border-ochre/20 bg-ochre/5 p-2 text-xs text-ochre italic">
                        « {submission.feedback_coach} »
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  {isLocked ? (
                    <span className="flex items-center gap-1.5 rounded-[2px] border border-dark/10 px-3 py-1.5 text-xs text-secondary">
                      <Lock className="h-3 w-3" /> Verrouillé
                    </span>
                  ) : status === "valide" ? (
                    <span className="flex items-center gap-1.5 rounded-[2px] border border-success/30 bg-success/5 px-3 py-1.5 text-xs text-success">
                      <CheckCircle2 className="h-3 w-3" /> Validé
                    </span>
                  ) : status === "soumis" ? (
                    <span className="flex items-center gap-1.5 rounded-[2px] border border-ochre/30 bg-ochre/5 px-3 py-1.5 text-xs text-ochre">
                      En attente
                    </span>
                  ) : (
                    <Link
                      href={`/missions/${mission.id}`}
                      className="flex items-center gap-1.5 rounded-[2px] bg-gold px-3 py-1.5 text-xs font-semibold text-ink transition-all hover:bg-amber hover:shadow-[0_0_12px_rgba(240,185,40,0.3)]"
                    >
                      Commencer <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                  {submission?.created_at && (
                    <span className="text-[0.625rem] text-secondary/60">
                      {formatDateTime(submission.created_at)}
                    </span>
                  )}
                </div>
              </div>
            </PremiumCard>
          );
        })}
      </div>

      {/* Next stage CTA */}
      {nextStage && !allValidated && (
        <div className="mt-6 rounded-[2px] border border-dashed border-dark/15 bg-paper/50 p-4 text-center">
          <p className="text-sm text-secondary">
            Validez toutes les missions de cette étape pour débloquer :{" "}
            <span className="font-semibold text-ochre">Étape {String(stageNum + 1).padStart(2, "0")} — {nextStage.title}</span>
          </p>
        </div>
      )}

      {allValidated && nextStage && (
        <div className="mt-6">
          <Link
            href={`/parcours/${nextStage.slug}`}
            className="group flex items-center gap-3 rounded-[2px] border border-gold/30 bg-gold/5 px-5 py-4 transition-all hover:bg-gold/10"
          >
            <Unlock className="h-5 w-5 text-gold" />
            <div>
              <p className="font-semibold text-dark">Étape suivante débloquée !</p>
              <p className="text-sm text-secondary">
                Étape {String(stageNum + 1).padStart(2, "0")} — {nextStage.title}
              </p>
            </div>
            <ArrowRight className="ml-auto h-5 w-5 text-gold transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      )}
    </div>
  );
}
