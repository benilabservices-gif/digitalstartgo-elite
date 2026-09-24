import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PremiumCard, StatBadge } from "@/components/app-ui/PremiumCard";
import { Badge } from "@/components/ui/Badge";
import {
  MISSION_STATUS_LABELS,
  MISSION_STATUS_TONE,
  toMissionStatus,
  canSubmitMission,
} from "@/lib/missions/status";
import { formatDateTime } from "@/lib/missions/format";
import { CheckCircle2, Clock, Lock, Unlock, FileText, ArrowRight, ChevronRight, AlertCircle, Database } from "lucide-react";

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
  id: string;
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

  // Fetch stage with its missions
  const { data: stageData, error: stageError } = await supabase
    .from("stages")
    .select("id, number, slug, title, objective, order_index, missions(id, number, title, objective, estimated_duration_minutes)")
    .eq("slug", params.slug)
    .maybeSingle();

  // If stage doesn't exist (migrations not applied), show helpful page
  if (stageError || !stageData) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
            <Database className="h-8 w-8 text-error" />
          </div>
          <h1 className="t-display-mid text-2xl text-dark">Parcours en construction</h1>
          <p className="max-w-md text-secondary">
            Le module <strong>{params.slug}</strong> n&apos;est pas encore disponible.
            Cela signifie que la base de données n&apos;a pas encore été initialisée.
          </p>
          <div className="mt-4 rounded-[2px] border border-ochre/30 bg-ochre/5 p-4 text-left max-w-md">
            <p className="mb-2 text-sm font-semibold text-ochre">Pour débloquer le parcours :</p>
            <ol className="list-decimal space-y-1.5 text-sm text-secondary">
              <li>Ouvrez <strong>Supabase Dashboard</strong></li>
              <li>Allez dans <strong>SQL Editor</strong></li>
              <li>Copiez-collez le contenu du fichier <code className="rounded bg-paper/50 px-1">supabase/scripts/setup.sql</code></li>
              <li>Cliquez <strong>Run</strong></li>
            </ol>
          </div>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-[2px] bg-gold px-5 py-2.5 text-sm font-semibold text-ink transition-all hover:bg-amber hover:shadow-[0_0_16px_rgba(240,185,40,0.3)]"
          >
            <ArrowRight className="h-4 w-4" />
            Retour au dashboard
          </Link>
        </div>
      </div>
    );
  }

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
    const allPrevMissionIds = prevStages.flatMap((s) => s.missions.map((m) => m.id));
    if (allPrevMissionIds.length > 0) {
      const { data: prevProgress } = await supabase
        .from("mission_progress")
        .select("mission_id, status")
        .in("mission_id", allPrevMissionIds);

      const prevProgressMap = new Map<string, string>();
      (prevProgress ?? []).forEach((p: any) => prevProgressMap.set(p.mission_id, p.status));

      isLocked = !allPrevMissionIds.every((mid) => prevProgressMap.get(mid) === "valide");
    }
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
    if (!progressEntry) continue;
    const { data: subs } = await supabase
      .from("mission_submissions")
      .select("statut, feedback_coach, created_at")
      .eq("mission_progress_id", progressEntry.id)
      .order("created_at", { ascending: false })
      .limit(1);
    if (subs?.[0]) {
      submissionsByMission.set(mission.id, subs[0] as SubmissionRow);
    }
  }

  // Check if this stage is fully validated
  const allValidated = stage.missions.length > 0 && stage.missions.every((m) => progressByMission.get(m.id) === "valide");
  const hasAnyProgress = stage.missions.some((m) => progressByMission.has(m.id));

  // Find next stage
  const { data: nextStageData } = await supabase
    .from("stages")
    .select("slug, title")
    .gt("number", stageNum)
    .order("number")
    .limit(1);
  const nextStage = (nextStageData ?? [0])[0] as { slug: string; title: string } | null;

  // Find current (first non-validated) mission in this stage
  const currentMission = stage.missions.find((m) => progressByMission.get(m.id) !== "valide");
  const currentStatus = currentMission ? toMissionStatus(progressByMission.get(currentMission.id)) : null;

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
          <li className="text-ochre font-medium">Étape {String(stageNum).padStart(2, "0")} — {stage.title}</li>
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
      {stage.missions.length === 0 ? (
        <PremiumCard className="text-center py-12">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-secondary/30" />
          <h3 className="text-lg font-semibold text-dark">Aucune mission configurée</h3>
          <p className="mt-2 text-sm text-secondary">
            Cette étape n&apos;a pas encore de missions associées. Contactez votre administrateur.
          </p>
        </PremiumCard>
      ) : (
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
      )}

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
