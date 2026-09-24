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
import { Clock, FileText, History, CheckCircle2, AlertCircle } from "lucide-react";

interface MissionRow {
  id: string;
  number: number;
  title: string;
  objective: string;
  estimated_duration_minutes: number;
  stages: { number: number; title: string } | null;
}

interface SubmissionRow {
  id: string;
  contenu: string;
  statut: SubmissionStatus;
  feedback_coach: string | null;
  created_at: string;
  updated_at: string;
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

export default async function MissionPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: mission } = await supabase
    .from("missions")
    .select("id, number, title, objective, estimated_duration_minutes, stages(number, title)")
    .eq("id", params.id)
    .maybeSingle();

  if (!mission) notFound();

  const missionRow = mission as unknown as MissionRow;

  const { data: progress } = await supabase
    .from("mission_progress")
    .select("id, status")
    .eq("profile_id", user.id)
    .eq("mission_id", missionRow.id)
    .maybeSingle();

  const status = toMissionStatus(progress?.status);

  const { data: submissionRows } = progress
    ? await supabase
        .from("mission_submissions")
        .select("id, contenu, statut, feedback_coach, created_at, updated_at")
        .eq("mission_progress_id", progress.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  const submissions = (submissionRows ?? []) as SubmissionRow[];
  const lastSubmission = submissions[0] ?? null;
  const blockedReason = submissionBlockedReason(status);

  // Status icon
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
          Étape {missionRow.stages?.number ?? missionRow.number} · {missionRow.stages?.title ?? "Mon Parcours"}
        </p>
        <div className="flex items-center gap-3">
          {statusIcon}
          <h1 className="t-display-mid text-[clamp(1.5rem,4vw,2.25rem)] text-dark">{missionRow.title}</h1>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Badge tone={MISSION_STATUS_TONE[status]}>{MISSION_STATUS_LABELS[status]}</Badge>
          <span className="flex items-center gap-1.5 text-sm text-secondary">
            <Clock className="h-3.5 w-3.5" />
            Durée estimée : {missionRow.estimated_duration_minutes} min
          </span>
        </div>
      </div>

      {/* Objectif */}
      <PremiumCard title="Objectif de la mission" className="mb-6">
        <p className="text-[1.0625rem] leading-relaxed text-dark">{missionRow.objective}</p>
      </PremiumCard>

      {/* Ressources */}
      <PremiumCard title="Ressources" className="mb-6" subtitle="Des guides pratiques vous attendent.">
        <p className="text-sm text-secondary">
          Ressources bientôt disponibles. En attendant, appuyez-vous sur l&apos;objectif ci-dessus et sur les retours de votre coach.
        </p>
      </PremiumCard>

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
            missionId={missionRow.id}
            missionProgressId={progress?.id ?? null}
            isCorrection={status === "a_corriger"}
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
                {/* Timeline dot */}
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
