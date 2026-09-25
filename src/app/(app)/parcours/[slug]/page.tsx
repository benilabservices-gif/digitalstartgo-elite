import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PremiumCard, StatBadge } from "@/components/app-ui/PremiumCard";
import { Badge } from "@/components/ui/Badge";
import {
  MISSION_STATUS_LABELS,
  MISSION_STATUS_TONE,
  toMissionStatus,
} from "@/lib/missions/status";
import { formatDateTime } from "@/lib/missions/format";
import { CheckCircle2, Clock, Lock, Unlock, FileText, ArrowRight, ChevronRight, AlertCircle, Database, BookOpen } from "lucide-react";
import type { ResourceBlock } from "@/lib/resources/types";

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

  const { data: stageData, error: stageError } = await supabase
    .from("stages")
    .select("id, number, slug, title, objective, order_index, missions(id, number, title, objective, estimated_duration_minutes)")
    .eq("slug", params.slug)
    .maybeSingle();

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
            Appliquez les migrations depuis <code className="rounded bg-paper/50 px-1 text-sm">supabase/scripts/setup.sql</code>.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-[2px] bg-gold px-5 py-2.5 text-sm font-semibold text-ink transition-all hover:bg-amber"
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

  // Lock logic: check ALL previous stages
  let isLocked = false;
  if (stageNum > 1) {
    const { data: prevStagesData } = await supabase
      .from("stages")
      .select("missions(id)")
      .lt("number", stageNum)
      .order("number", { ascending: true });

    const allPrevMissionIds = ((prevStagesData ?? []) as any[]).flatMap((s) => (s.missions ?? []).map((m: any) => m.id));
    if (allPrevMissionIds.length > 0) {
      const { data: prevProgress } = await supabase
        .from("mission_progress")
        .select("mission_id, status")
        .in("mission_id", allPrevMissionIds);

      const prevMap = new Map((prevProgress ?? []).map((p: any) => [p.mission_id, p.status]));
      isLocked = !allPrevMissionIds.every((mid) => prevMap.get(mid) === "valide");
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

  const allValidated = stage.missions.length > 0 && stage.missions.every((m) => progressByMission.get(m.id) === "valide");

  // Find next stage
  const { data: nextStageData } = await supabase
    .from("stages")
    .select("slug, title, number")
    .gt("number", stageNum)
    .order("number")
    .limit(1);
  const nextStage = (nextStageData ?? [0])[0] as { slug: string; title: string; number: number } | null;

  // Fetch resources for THIS stage
  let stageResources: any[] = [];
  if (!isLocked) {
    const { data: resData } = await supabase
      .from("resources")
      .select("id, slug, title, description")
      .eq("stage_id", stage.id)
      .order("order_index")
      .limit(3);
    stageResources = resData ?? [];
  }

  const currentMission = stage.missions.find((m) => progressByMission.get(m.id) !== "valide");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pb-24 sm:px-6 sm:py-10 sm:pb-10">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-secondary">
          <li><Link href="/dashboard" className="hover:text-ochre">Mon Parcours</Link></li>
          <li><ChevronRight className="h-3 w-3" /></li>
          <li className="text-ochre font-medium">Étape {String(stageNum).padStart(2, "0")} — {stage.title}</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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

      {/* Guides pratiques de l'étape */}
      {stageResources.length > 0 && !isLocked && (
        <div className="mb-6 space-y-3">
          <p className="t-meta text-xs uppercase tracking-widest text-ochre">
            Guides pratiques — Étape {String(stageNum).padStart(2, "0")}
          </p>
          {stageResources.map((resource: any) => (
            <Link
              key={resource.id}
              href={`/ressources/${resource.slug}`}
              className="group flex items-start gap-3 rounded-[2px] border border-dark/8 bg-white p-4 transition-all hover:border-ochre/30 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[2px] bg-gold/15">
                <BookOpen className="h-5 w-5 text-ochre" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-dark group-hover:text-ochre transition-colors">{resource.title}</h3>
                <p className="mt-0.5 text-xs text-secondary line-clamp-2">{resource.description}</p>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-secondary/50 transition-transform group-hover:translate-x-0.5 group-hover:text-ochre" />
            </Link>
          ))}
        </div>
      )}

      {/* Missions */}
      {stage.missions.length === 0 ? (
        <PremiumCard className="text-center py-12">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-secondary/30" />
          <h3 className="text-lg font-semibold text-dark">Aucune mission configurée</h3>
          <p className="mt-2 text-sm text-secondary">Contactez votre administrateur.</p>
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
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      status === "valide"
                        ? "bg-success/15 text-success"
                        : status === "a_corriger"
                        ? "bg-error/15 text-error"
                        : status === "soumis"
                        ? "bg-ochre/15 text-ochre"
                        : "bg-dark/10 text-secondary"
                    }`}>
                      {status === "valide" ? <CheckCircle2 className="h-4 w-4" /> : String(mission.number).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-dark">{mission.title}</h3>
                        <Badge tone={MISSION_STATUS_TONE[status]}>{MISSION_STATUS_LABELS[status]}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-secondary">{mission.objective}</p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-secondary">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />~{mission.estimated_duration_minutes} min
                        </span>
                        {submission?.feedback_coach && (
                          <span className="flex items-center gap-1 text-ochre">
                            <FileText className="h-3 w-3" />Feedback disponible
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

                  <div className="flex shrink-0 items-center sm:flex-col sm:items-end sm:gap-2">
                    {isLocked ? (
                      <span className="flex items-center gap-1.5 rounded-[2px] border border-dark/10 px-3 py-1.5 text-xs text-secondary">
                        <Lock className="h-3 w-3" /> Verrouillé
                      </span>
                    ) : status === "valide" ? (
                      <span className="flex items-center gap-1.5 rounded-[2px] border border-success/30 bg-success/5 px-3 py-1.5 text-xs text-success">
                        <CheckCircle2 className="h-3 w-3" /> Validé
                      </span>
                    ) : status === "soumis" ? (
                      <Link
                        href={`/missions/${mission.id}`}
                        className="flex items-center gap-1.5 rounded-[2px] border border-ochre/30 bg-ochre/5 px-3 py-1.5 text-xs text-ochre hover:bg-ochre/10"
                      >
                        <FileText className="h-3 w-3" /> Voir mon livrable
                      </Link>
                    ) : (
                      <Link
                        href={`/missions/${mission.id}`}
                        className="flex items-center gap-1.5 rounded-[2px] bg-gold px-3 py-1.5 text-xs font-semibold text-ink transition-all hover:bg-amber hover:shadow-[0_0_12px_rgba(240,185,40,0.3)]"
                      >
                        Commencer <ArrowRight className="h-3 w-3" />
                      </Link>
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
            Validez toutes les missions pour débloquer :{" "}
            <span className="font-semibold text-ochre">Étape {String(nextStage.number).padStart(2, "0")} — {nextStage.title}</span>
          </p>
        </div>
      )}

      {allValidated && nextStage && (
        <Link
          href={`/parcours/${nextStage.slug}`}
          className="group mt-6 flex items-center gap-3 rounded-[2px] border border-gold/30 bg-gold/5 p-5 transition-all hover:bg-gold/10"
        >
          <Unlock className="h-5 w-5 shrink-0 text-gold" />
          <div>
            <p className="font-semibold text-dark">Étape suivante débloquée !</p>
            <p className="text-sm text-secondary">Étape {String(nextStage.number).padStart(2, "0")} — {nextStage.title}</p>
          </div>
          <ArrowRight className="ml-auto h-5 w-5 text-gold transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
