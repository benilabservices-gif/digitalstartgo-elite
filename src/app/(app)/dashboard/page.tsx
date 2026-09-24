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
import { ArrowRight, Play, Sparkles } from "lucide-react";

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

  const { data: stages } = await supabase
    .from("stages")
    .select("id, number, slug, title, missions(id, number, title)")
    .order("order_index");

  const { data: progressRows } = await supabase
    .from("mission_progress")
    .select("mission_id, status")
    .eq("profile_id", user.id);

  const progressByMission = new Map((progressRows ?? []).map((row) => [row.mission_id, row.status]));

  const allMissions = (stages ?? []).flatMap((stage) => stage.missions);
  const validatedCount = allMissions.filter(
    (mission) => progressByMission.get(mission.id) === "valide"
  ).length;
  const overallProgress = allMissions.length > 0 ? (validatedCount / allMissions.length) * 100 : 0;

  // Find current (first non-validated) mission
  const currentMission = allMissions.find((m) => progressByMission.get(m.id) !== "valide");
  const currentStatus = currentMission
    ? toMissionStatus(progressByMission.get(currentMission.id))
    : null;

  // Find which stage the current mission belongs to
  const currentStage = (stages ?? []).find((stage) =>
    stage.missions.some((m) => m.id === currentMission?.id)
  );

  // Find next unlocked stage
  const nextStageNum = currentMission
    ? ((currentStage?.number ?? 1) + 1)
    : 1;
  const nextStage = (stages ?? []).find((s) => s.number === nextStageNum);

  // Check notifications count
  const { data: notifRows } = await supabase
    .from("notifications")
    .select("id")
    .eq("profile_id", user.id)
    .eq("read", false);
  const unreadCount = (notifRows ?? []).length;

  // Compute stage-level stats
  const stageStats = (stages ?? []).map((stage) => {
    const stageMissions = stage.missions;
    const completed = stageMissions.filter((m) => progressByMission.get(m.id) === "valide").length;
    const total = stageMissions.length;
    return { number: stage.number, title: stage.title, completed, total };
  });

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
            : "Parfait ! Toutes vos étapes sont terminées. Vous avez construit votre système de vente."}
        </p>
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBadge label="Funnel Score" value={`${validatedCount}/${allMissions.length}`} sub="missions validées" tone="gold" />
        <StatBadge label="Étape actuelle" value={currentStage ? String(currentStage.number).padStart(2, "0") : "—"} sub={currentStage?.title ?? ""} />
        <StatBadge label="Progression" value={`${Math.round(overallProgress)}%`} sub="du parcours" />
        <StatBadge
          label="Dernier statut"
          value={currentStatus ? MISSION_STATUS_LABELS[currentStatus].split(" ")[0] : "—"}
          sub={currentStatus ? MISSION_STATUS_LABELS[currentStatus] : "En attente"}
          tone={currentStatus === "valide" ? "success" : currentStatus === "a_corriger" ? "error" : "default"}
        />
      </div>

      {/* Progression globale */}
      <PremiumCard className="mb-6" glow>
        <StepIndicator
          current={validatedCount}
          total={allMissions.length}
          stages={(stages ?? []).map((s) => ({ number: s.number, title: s.title }))}
        />
      </PremiumCard>

      {/* CTA principal — Mission actuelle */}
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
              <p className="mt-1 text-sm text-secondary">{currentStage?.title ?? ""}</p>
            </div>
            <Link
              href={`/missions/${currentMission.id}`}
              className="group flex shrink-0 items-center gap-2 rounded-[2px] bg-gold px-5 py-3 text-sm font-semibold text-ink transition-all hover:bg-amber hover:shadow-[0_0_24px_rgba(240,185,40,0.4)]"
            >
              <Play className="h-4 w-4" />
              Continuer
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </PremiumCard>
      )}

      {/* Tous terminé */}
      {!currentMission && (
        <PremiumCard className="mb-6 text-center border-l-[3px] border-l-success" glow>
          <div className="flex flex-col items-center gap-2">
            <svg className="h-12 w-12 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="t-display-mid text-2xl text-dark">Parcours terminé !</h2>
            <p className="text-secondary">
              Félicitations, vous avez complété les 8 étapes. Votre système de vente est en place.
            </p>
            {nextStage && (
              <Link
                href={`/parcours/${nextStage.slug}`}
                className="mt-4 flex items-center gap-2 rounded-[2px] border border-gold/30 bg-gold/5 px-4 py-2 text-sm font-medium text-ochre hover:bg-gold/10"
              >
                <Sparkles className="h-4 w-4" />
                Consulter les ressources de l&apos;étape {String(nextStage.number).padStart(2, "0")}
              </Link>
            )}
          </div>
        </PremiumCard>
      )}

      {/* Coach card */}
      {profile.role === "coach" && (
        <PremiumCard className="mb-6 border-l-[3px] border-l-ochre" subtitle="Vous avez des livrables à revoir.">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ochre/10">
                <svg className="h-5 w-5 text-ochre" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
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
          {stageStats.map((stage) => (
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
