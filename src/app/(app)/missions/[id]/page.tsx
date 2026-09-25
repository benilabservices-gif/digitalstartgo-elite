import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PremiumCard } from "@/components/app-ui/PremiumCard";
import { Badge } from "@/components/ui/Badge";
import { MissionSubmissionForm } from "@/components/missions/MissionSubmissionForm";
import { formatDateTime } from "@/lib/missions/format";
import {
  MISSION_STATUS_LABELS,
  MISSION_STATUS_TONE,
  canSubmitMission,
  submissionBlockedReason,
  toMissionStatus,
  type SubmissionStatus,
} from "@/lib/missions/status";
import { Clock, FileText, CheckCircle2, AlertCircle, BookOpen, ArrowRight } from "lucide-react";

interface MissionData {
  id: string;
  number: number;
  title: string;
  objective: string;
  estimated_duration_minutes: number;
  stage_id: string;
  stages?: { number: number; title: string } | null;
}

interface ProgressData {
  id: string;
  status: string;
}

interface SubmissionRow {
  id: string;
  contenu: string;
  statut: SubmissionStatus;
  feedback_coach: string | null;
  created_at: string;
  updated_at: string;
}

interface ResourceRow {
  id: string;
  slug: string;
  title: string;
  description: string;
}

const SUBMISSION_TONE: Record<SubmissionStatus, "default" | "success" | "warning" | "error"> = {
  soumis: "warning",
  a_corriger: "error",
  valide: "success",
};

const SUBMISSION_LABELS: Record<SubmissionStatus, string> = {
  soumis: "En attente de revue",
  a_corriger: "À corriger",
  valide: "Validé",
};

// Helper: fetch with service role to bypass RLS
async function svcFetch<T>(path: string): Promise<T | null> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL!}/rest/v1/${path}`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      cache: "no-store",
    }
  );
  if (!res.ok) return null;
  const data: T[] = await res.json();
  return data?.[0] ?? null;
}

async function svcFetchAll<T>(path: string): Promise<T[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL!}/rest/v1/${path}`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );
  if (!res.ok) return [];
  return (await res.json()) as T[];
}

export default async function MissionPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch mission data via service role
  const mission = await svcFetch<MissionData>(`missions?id=eq.${params.id}&select=id,number,title,objective,estimated_duration_minutes,stages(number,title)`);
  if (!mission) notFound();

  // Fetch progress
  const progressList = await svcFetchAll<ProgressData>(
    `mission_progress?profile_id=eq.${user.id}&mission_id=eq.${params.id}&select=id,status`
  );
  const progress = progressList[0] ?? null;
  const status = toMissionStatus(progress?.status);

  // Fetch submissions
  const submissions: SubmissionRow[] = progress
    ? await svcFetchAll<SubmissionRow>(
        `mission_submissions?mission_progress_id=eq.${progress.id}&select=id,contenu,statut,feedback_coach,created_at,updated_at&order=created_at.desc`
      )
    : [];

  // Fetch stage resources
  const stageId = mission.stage_id;
  const allResources: ResourceRow[] = stageId
    ? await svcFetchAll<ResourceRow>(
        `resources?stage_id=eq.${stageId}&select=id,slug,title,description&order=order_index.asc`
      )
    : [];

  const lastSubmission = submissions[0] ?? null;
  const blockedReason = submissionBlockedReason(status);

  const statusIcon = {
    a_faire: <AlertCircle className="h-4 w-4 text-secondary" />,
    en_cours: <Clock className="h-4 w-4 text-ochre" />,
    soumis: <FileText className="h-4 w-4 text-ochre" />,
    a_corriger: <AlertCircle className="h-4 w-4 text-error" />,
    valide: <CheckCircle2 className="h-4 w-4 text-success" />,
  }[status] ?? <AlertCircle className="h-4 w-4 text-secondary" />;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 pb-24 sm:pb-10">
      {/* Back link */}
      <Link href="/dashboard" className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-ochre hover:underline">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour à mon parcours
      </Link>

      {/* Header */}
      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-ochre">
          Étape {mission.stages?.number ?? mission.number} · {mission.stages?.title ?? "Mon Parcours"}
        </p>
        <div className="flex items-center gap-3">
          {statusIcon}
          <h1 className="t-display-mid text-[clamp(1.5rem,4vw,2.25rem)] text-dark">{mission.title}</h1>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Badge tone={MISSION_STATUS_TONE[status]}>{MISSION_STATUS_LABELS[status]}</Badge>
          <span className="flex items-center gap-1.5 text-sm text-secondary">
            <Clock className="h-3.5 w-3.5" />
            Durée estimée : {mission.estimated_duration_minutes} min
          </span>
        </div>
      </div>

      {/* Objectif + Guide d'aide */}
      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <PremiumCard title="Objectif de la mission">
          <p className="text-[1.0625rem] leading-relaxed text-dark">{mission.objective}</p>
        </PremiumCard>

        {allResources.length > 0 ? (
          <PremiumCard
            title="Guide pratique"
            subtitle={`${allResources.length} ressource(s) pour vous aider`}
            glow
          >
            <div className="space-y-3">
              {allResources.slice(0, 2).map((resource) => (
                <Link
                  key={resource.id}
                  href={`/ressources/${resource.slug}`}
                  className="group flex items-start gap-3 rounded-[2px] border border-dark/8 p-3 transition-colors hover:border-ochre/30 hover:bg-paper/50"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[2px] bg-gold/15">
                    <BookOpen className="h-4 w-4 text-ochre" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-dark group-hover:text-ochre transition-colors truncate">
                      {resource.title}
                    </p>
                    <p className="mt-0.5 text-xs text-secondary line-clamp-2">{resource.description}</p>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 text-secondary/50 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:text-ochre" />
                </Link>
              ))}
              {allResources.length > 2 && (
                <Link
                  href="/ressources"
                  className="block text-xs font-medium text-ochre hover:underline text-center pt-1"
                >
                  Voir toutes les ressources →
                </Link>
              )}
            </div>
          </PremiumCard>
        ) : (
          <PremiumCard title="Guide pratique">
            <p className="text-sm text-secondary">
              Les guides pratiques seront ajoutés prochainement. En attendant, consultez la section Ressources du menu.
            </p>
          </PremiumCard>
        )}
      </div>

      {/* Feedback coach */}
      {lastSubmission?.feedback_coach && (
        <PremiumCard
          title="Retour de votre coach"
          className="mb-6 border-l-[3px] border-l-gold"
          subtitle={`Reçu le ${formatDateTime(lastSubmission.updated_at)}`}
        >
          <p className="whitespace-pre-wrap text-[1.0625rem] leading-relaxed text-dark">
            {lastSubmission.feedback_coach}
          </p>
        </PremiumCard>
      )}

      {/* Soumission */}
      <PremiumCard
        title={status === "a_corriger" ? "Renvoyer mon livrable" : "Soumettre mon livrable"}
        subtitle={status === "a_corriger" ? "Votre coach a demandé des modifications." : "Décrivez votre livrable ou collez le lien."}
        className="mb-6"
      >
        {canSubmitMission(status) ? (
          <MissionSubmissionForm
            missionId={mission.id}
            missionProgressId={progress?.id ?? null}
            isCorrection={status === "a_corriger"}
            missionTitle={mission.title}
          />
        ) : (
          <div className="flex items-center gap-2 text-sm text-secondary">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {blockedReason}
          </div>
        )}
      </PremiumCard>

      {/* Historique */}
      {submissions.length > 0 && (
        <PremiumCard title="Historique de mes soumissions" subtitle={`${submissions.length} soumission(s)`}>
          <ol className="space-y-4">
            {submissions.map((submission, index) => (
              <li
                key={submission.id}
                className={`relative pl-6 ${index < submissions.length - 1 ? "pb-4 border-b border-dark/6" : ""}`}
              >
                <span
                  className={`absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 ${
                    submission.statut === "valide"
                      ? "border-success bg-success"
                      : submission.statut === "a_corriger"
                      ? "border-error bg-error"
                      : "border-ochre bg-paper"
                  }`}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={SUBMISSION_TONE[submission.statut]}>
                    {SUBMISSION_LABELS[submission.statut]}
                  </Badge>
                  <span className="text-xs text-secondary">
                    {formatDateTime(submission.created_at)}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-dark">
                  {submission.contenu}
                </p>
                {submission.feedback_coach && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-secondary italic">
                    Coach : {submission.feedback_coach}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </PremiumCard>
      )}
    </div>
  );
}
