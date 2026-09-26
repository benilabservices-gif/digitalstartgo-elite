import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PremiumCard, StatBadge, StepIndicator } from "@/components/app-ui/PremiumCard";
import { Badge } from "@/components/ui/Badge";
import {
  MISSION_STATUS_LABELS,
  MISSION_STATUS_TONE,
  toMissionStatus,
} from "@/lib/missions/status";
import { deriveCohortStatus } from "@/lib/cohorts/status";
import { isStageValidated, getNextMissionId } from "@/lib/missions/stage-lock";
import { ArrowRight, Play, Sparkles, CheckCircle2, Trophy } from "lucide-react";

const COHORT_STATUS_LABELS = {
  a_venir: "À venir",
  en_cours: "En cours",
  terminee: "Terminée",
} as const;

async function CohortCard({ cohortId }: { cohortId: string }) {
  const supabase = createClient();
  const { data: cohort } = await supabase
    .from("cohorts")
    .select("name, starts_at, ends_at")
    .eq("id", cohortId)
    .maybeSingle();

  if (!cohort) return null;

  const status = deriveCohortStatus(cohort.starts_at, cohort.ends_at);

  return (
    <PremiumCard
      title={cohort.name}
      subtitle={`Du ${cohort.starts_at} au ${cohort.ends_at}`}
      badge={COHORT_STATUS_LABELS[status]}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${status === "en_cours" ? "bg-gold animate-pulse" : "bg-steel/40"}`} />
          <span className="text-sm text-secondary">
            {status === "en_cours" ? "Cohorte active" : status === "a_venir" ? "Démarre bientôt" : "Terminée"}
          </span>
        </div>
        <Link href="/dashboard" className="flex items-center gap-1 text-sm font-medium text-ochre hover:underline">
          Voir détails <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </PremiumCard>
  );
}

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, onboarding_completed, role, cohort_id")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed) redirect("/onboarding");

  // Get latest diagnostic result
  const { data: diagnostic } = await supabase
    .from("diagnostics")
    .select("score, priorities")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: stages } = await supabase
    .from("stages")
    .select("id, number, slug, title, order_index, missions(id, code, number, order_index, titre, objective, estimated_duration_minutes, ordre, active, pourquoi, exemple_avant, exemple_apres, champs, criteres, guide_outil, prompts_ia, bonus_elite)")
    .order("order_index");

  const { data: progressRows } = await supabase
    .from("mission_progress")
    .select("mission_id, status")
    .eq("profile_id", user.id);

  const progressMap = new Map<string, string>((progressRows ?? []).map((row: any) => [row.mission_id, row.status]));

  // Build sorted missions: by stage.number asc, then mission.ordre asc
  const stagesArray = (stages ?? []) as any[];
  const allMissions = stagesArray
    .flatMap((stage: any) => (stage.missions ?? []).map((m: any) => ({ ...m, _stageNumber: stage.number })))
    .sort((a: any, b: any) => a._stageNumber - b._stageNumber || (a.ordre ?? 0) - (b.ordre ?? 0));

  // Count only active missions for progress
  const activeMissions = allMissions.filter((m: any) => m.active !== false);
  const validatedCount = activeMissions.filter((m: any) => progressMap.get(m.id) === "valide").length;
  const overallProgress = activeMissions.length > 0 ? (validatedCount / activeMissions.length) * 100 : 0;

  // Find current mission using getNextMissionId on each stage
  let currentMission: any = null;
  let currentStage: any = null;

  for (const stage of stagesArray) {
    const stageMissions = stage.missions ?? [];
    // Check if previous stage is validated
    const stageIndex = stage.number - 1;
    const prevStage = stagesArray.find((s: any) => s.number === stageIndex);
    if (prevStage) {
      const prevMissions = prevStage.missions ?? [];
      if (!isStageValidated(prevMissions, progressMap)) {
        // Previous stage not validated — this stage is locked
        continue;
      }
    }
    // Check if this stage's missions are all validated
    if (isStageValidated(stageMissions, progressMap)) {
      continue; // Stage fully completed
    }
    // Get next mission in this stage
    const nextId = getNextMissionId(stageMissions, progressMap);
    if (nextId) {
      currentMission = stageMissions.find((m: any) => m.id === nextId);
      currentStage = stage;
      break;
    }
  }

  const currentStatus = currentMission
    ? toMissionStatus(progressMap.get(currentMission.id))
    : null;

  // Check notifications count
  const { data: notifRows } = await supabase
    .from("notifications")
    .select("id")
    .eq("profile_id", user.id)
    .eq("read", false);
  const unreadCount = (notifRows ?? []).length;

  // Compute stage-level stats — only count active missions
  const stageStats = stagesArray.map((stage: any) => {
    const stageMissions = (stage.missions ?? []).filter((m: any) => m.active !== false);
    const completed = stageMissions.filter((m: any) => progressMap.get(m.id) === "valide").length;
    const total = stageMissions.length;
    return { number: stage.number, title: stage.title, completed, total };
  });

  // Determine what to show based on diagnostic completion
  const hasDiagnostic = !!diagnostic;
  const diagnosticScore = diagnostic?.score;
  const diagnosticPriorities = (diagnostic?.priorities ?? []) as string[];

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 pb-24 sm:pb-10">
      {/* Header avec greeting contextuel */}
      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-ochre">
          Bonjour, {profile.business_name ?? "Participant"}
          {unreadCount > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[0.625rem] text-gold">
              <Sparkles className="h-3 w-3" />
              {unreadCount} nouveau{unreadCount > 1 ? "x" : ""}
            </span>
          )}
        </p>
        <h1 className="t-display-mid text-[clamp(1.75rem,4vw,2.5rem)] text-dark">
          Votre système de vente
        </h1>
        <p className="mt-2 text-[1.0625rem] text-secondary">
          {currentMission
            ? `Vous êtes à l&apos;étape ${String(currentStage?.number ?? "?").padStart(2, "0")} — ${currentStage?.title ?? ""}. Continuez là où vous en êtes.`
            : "Parfait ! Toutes vos étapes sont terminées. Votre système de vente est en place."}
        </p>
      </div>

      {/* Diagnostic result banner (if completed) */}
      {hasDiagnostic && (
        <PremiumCard className="mb-6 border-l-[3px] border-l-gold" glow>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ink">
                <span className="t-chiffre text-xl text-gold">{diagnosticScore}</span>
              </div>
              <div>
                <p className="t-meta text-xs uppercase tracking-widest text-ochre">Votre Funnel Score</p>
                <p className="text-sm text-secondary mt-0.5">
                  {diagnosticScore >= 70
                    ? "Votre système est solide. Optimisez les détails."
                    : diagnosticScore >= 40
                    ? "Des bases existent. Renforcez les zones faibles."
                    : "Votre système a besoin de fondations solides. Commencez par l&apos;étape 1."}
                </p>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="t-meta mb-2 text-xs uppercase tracking-widest text-steel/60">Vos 3 priorités</p>
              <ol className="space-y-1">
                {diagnosticPriorities.slice(0, 3).map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-dark">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/20 text-[0.625rem] font-bold text-ochre">
                      {i + 1}
                    </span>
                    <span className="truncate">{p}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </PremiumCard>
      )}

      {/* Call to action — directly to first actionable mission */}
      {currentMission && currentStatus && (
        <PremiumCard className="mb-6 border-l-[3px] border-l-gold" glow>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="t-meta rounded-full bg-gold/15 px-2 py-0.5 text-[0.6875rem] text-gold">
                  Étape {String(currentStage?.number ?? "?").padStart(2, "0")}
                </span>
                <Badge tone={MISSION_STATUS_TONE[currentStatus]}>{MISSION_STATUS_LABELS[currentStatus]}</Badge>
              </div>
              <h2 className="t-display-mid mt-2 text-xl text-dark">{currentMission.title}</h2>
              <p className="mt-1 text-sm text-secondary">
                {currentStage?.title ?? ""}
              </p>
              <p className="mt-2 text-xs text-steel/70">
                {currentStatus === "a_faire" && "Cliquez pour commencer cette mission."}
                {currentStatus === "en_cours" && "Reprenez là où vous vous êtes arrêté."}
                {currentStatus === "soumis" && "En attente du feedback de votre coach."}
                {currentStatus === "a_corriger" && "Votre coach a demandé des modifications. Mettez à jour votre livrable."}
              </p>
            </div>
            <Link
              href={`/missions/${currentMission.code ?? currentMission.id}`}
              className="group flex shrink-0 items-center gap-2 rounded-[2px] bg-gold px-6 py-3.5 text-sm font-semibold text-ink transition-all hover:bg-amber hover:shadow-[0_0_24px_rgba(240,185,40,0.4)]"
            >
              {currentStatus === "a_faire" || currentStatus === "en_cours" ? (
                <>
                  <Play className="h-4 w-4" />
                  {currentStatus === "a_faire" ? "Commencer" : "Continuer"}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Voir mon livrable
                </>
              )}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </PremiumCard>
      )}

      {/* Pas de mission actuelle — rediriger vers le parcours */}
      {!currentMission && !hasDiagnostic && (
        <PremiumCard className="mb-6 text-center border-l-[3px] border-l-gold" glow>
          <Sparkles className="mx-auto mb-3 h-8 w-8 text-gold" />
          <h2 className="t-display-mid text-xl text-dark">Votre parcours commence ici</h2>
          <p className="mt-2 text-secondary max-w-md mx-auto">
            Réalisez votre diagnostic pour obtenir votre Funnel Score et découvrir vos 3 priorités.
          </p>
          <Link
            href="/diagnostic"
            className="mt-5 inline-flex items-center gap-2 rounded-[2px] bg-gold px-6 py-3 text-sm font-semibold text-ink transition-all hover:bg-amber hover:shadow-[0_0_20px_rgba(240,185,40,0.3)]"
          >
            Faire mon diagnostic
            <ArrowRight className="h-4 w-4" />
          </Link>
        </PremiumCard>
      )}

      {/* Tous terminé */}
      {!currentMission && hasDiagnostic && (
        <PremiumCard className="mb-6 text-center border-l-[3px] border-l-success" glow>
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
              <Trophy className="h-7 w-7 text-success" />
            </div>
            <h2 className="t-display-mid text-2xl text-dark">Parcours terminé !</h2>
            <p className="text-secondary max-w-md">
              Félicitations, vous avez complété les 8 étapes. Votre système de vente est en place.
            </p>
            <p className="mt-1 text-sm text-ochre font-medium">
              Funnel Score : {diagnosticScore}/100
            </p>
          </div>
        </PremiumCard>
      )}

      {/* Stats grid */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBadge
          label="Funnel Score"
          value={hasDiagnostic ? String(diagnosticScore) : "—"}
          sub={hasDiagnostic ? "/100" : "Non fait"}
          tone={hasDiagnostic ? (diagnosticScore! >= 70 ? "success" as const : diagnosticScore! >= 40 ? "gold" as const : "error" as const) : "default"}
        />
        <StatBadge
          label="Étape actuelle"
          value={currentStage ? String(currentStage.number).padStart(2, "0") : (hasDiagnostic ? "—" : "1er")}
          sub={currentStage?.title ?? (hasDiagnostic ? "À venir" : "Diagnostic")}
        />
        <StatBadge label="Progression" value={`${Math.round(overallProgress)}%`} sub="du parcours" />
        <StatBadge
          label="Missions validées"
          value={`${validatedCount}/${activeMissions.length}`}
          sub="missions complétées"
          tone="gold"
        />
      </div>

      {/* Progression globale */}
      <PremiumCard className="mb-6" glow>
        <StepIndicator
          current={validatedCount}
          total={activeMissions.length}
          stages={(stages ?? []).map((s: any) => ({ number: s.number, title: s.title }))}
        />
      </PremiumCard>

      {/* Coach card */}
      {profile.role === "coach" && (
        <PremiumCard className="mb-6 border-l-[3px] border-l-ochre" subtitle="Vous avez des livrables à revoir.">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ochre/10">
                <svg className="h-5 w-5 text-ochre" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012 -2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-dark">File de revue</p>
                <p className="text-sm text-secondary">Livrables en attente de votre correction</p>
              </div>
            </div>
            <Link
              href="/coach"
              className="flex items-center gap-1 text-sm font-semibold text-ochre hover:underline"
            >
              Ouvrir <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </PremiumCard>
      )}

      {/* Cohort */}
      {profile.cohort_id && <CohortCard cohortId={profile.cohort_id} />}

      {/* Progression par étape */}
      <PremiumCard className="mt-6" title="Progression par étape">
        <ol className="flex flex-col gap-2">
          {stageStats.map((stage: any) => (
            <li key={stage.number} className="flex items-center justify-between gap-3 py-2">
              <div className="flex min-w-0 items-center gap-3">
                <span className="t-chiffre w-8 shrink-0 text-[0.875rem] text-ochre">
                  {String(stage.number).padStart(2, "0")}
                </span>
                <span className="truncate text-sm text-dark">{stage.title}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden w-20 overflow-hidden rounded-full bg-dark/8 sm:block">
                  <div
                    className="h-[3px] rounded-full bg-gold"
                    style={{ width: `${stage.total > 0 ? (stage.completed / stage.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="t-meta shrink-0 text-[0.75rem] text-secondary">
                  {stage.completed}/{stage.total}
                </span>
                {stage.completed === stage.total && stage.total > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success/15">
                    <svg className="h-3 w-3 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </div>
            </li>
          ))}
        </ol>
      </PremiumCard>
    </div>
  );
}
