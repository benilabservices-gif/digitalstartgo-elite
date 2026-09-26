import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchParticipantNames, requireCoach } from "@/lib/missions/coach";
import { PremiumCard } from "@/components/app-ui/PremiumCard";
import { CoachReviewForm } from "@/components/coach/CoachReviewForm";
import { formatDateTime } from "@/lib/missions/format";
import { Badge } from "@/components/ui/Badge";
import { FileText, User, Calendar, Target } from "lucide-react";
import type { SubmissionStatus } from "@/lib/missions/status";

interface SubmissionDetailRow {
  id: string;
  contenu: string;
  statut: SubmissionStatus;
  feedback_coach: string | null;
  created_at: string;
  updated_at: string;
  mission_progress: {
    id: string;
    profile_id: string;
    missions: { number: number; title: string; objective: string } | null;
  } | null;
}

interface PreviousSubmissionRow {
  id: string;
  contenu: string;
  statut: SubmissionStatus;
  feedback_coach: string | null;
  created_at: string;
}

const STATUT_LABELS: Record<SubmissionStatus, string> = {
  soumis: "En attente de revue",
  a_corriger: "Correction demandée",
  valide: "Validé",
};

const STATUT_TONE: Record<SubmissionStatus, "default" | "success" | "warning" | "error"> = {
  soumis: "warning",
  a_corriger: "error",
  valide: "success",
};

export default async function CoachSubmissionPage({ params }: { params: { id: string } }) {
  const { supabase } = await requireCoach();

  const { data } = await supabase
    .from("mission_submissions")
    .select(
      "id, contenu, statut, feedback_coach, created_at, updated_at, mission_progress(id, profile_id, missions(number, title, objective))"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!data) notFound();

  const submission = data as unknown as SubmissionDetailRow;
  const mission = submission.mission_progress?.missions;
  const names = await fetchParticipantNames(supabase, [
    submission.mission_progress?.profile_id,
  ]);
  const participant =
    (submission.mission_progress
      ? names.get(submission.mission_progress.profile_id)
      : null) ?? "Participant sans nom";

  const { data: previousData } = submission.mission_progress
    ? await supabase
        .from("mission_submissions")
        .select("id, contenu, statut, feedback_coach, created_at")
        .eq("mission_progress_id", submission.mission_progress.id)
        .neq("id", submission.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  const previousSubmissions = (previousData ?? []) as unknown as PreviousSubmissionRow[];

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 pb-24 sm:pb-10">
      <Link href="/coach" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ochre hover:underline">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour à la file de revue
      </Link>

      {/* Header */}
      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-ochre">
          Mission {mission?.number ?? "?"}
        </p>
        <h1 className="t-display-mid text-[clamp(1.5rem,4vw,2.25rem)] text-dark">
          {mission?.title ?? "Mission inconnue"}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Badge tone={STATUT_TONE[submission.statut]}>{STATUT_LABELS[submission.statut]}</Badge>
          <span className="flex items-center gap-1.5 text-sm text-secondary">
            <User className="h-3.5 w-3.5" />
            {participant}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-secondary">
            <Calendar className="h-3.5 w-3.5" />
            soumis le {formatDateTime(submission.created_at)}
          </span>
        </div>
      </div>

      {/* Objectif */}
      {mission?.objective && (
        <PremiumCard
          title="Objectif attendu"
          className="mb-6"
          subtitle="Ce qui était demandé dans cette mission"
        >
          <div className="flex items-start gap-3">
            <Target className="mt-0.5 h-4 w-4 shrink-0 text-ochre" />
            <p className="text-[1.0625rem] leading-relaxed text-dark">{mission.objective}</p>
          </div>
        </PremiumCard>
      )}

      {/* Livrable */}
      <PremiumCard
        title="Livrable soumis"
        className="mb-6"
        subtitle={`${submission.contenu.length} caractères`}
      >
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
          <p className="whitespace-pre-wrap break-words text-[1.0625rem] leading-relaxed text-dark">
            {submission.contenu}
          </p>
        </div>
      </PremiumCard>

      {/* Revue */}
      <PremiumCard
        title="Votre revue"
        className={`mb-6 ${submission.statut !== "soumis" ? "border-l-[3px] border-l-steel/30" : ""}`}
      >
        {submission.statut === "soumis" ? (
          <CoachReviewForm submissionId={submission.id} />
        ) : (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Badge tone={STATUT_TONE[submission.statut]}>{STATUT_LABELS[submission.statut]}</Badge>
              <span className="text-xs text-secondary">
                le {formatDateTime(submission.updated_at)}
              </span>
            </div>
            {submission.feedback_coach && (
              <p className="whitespace-pre-wrap text-[1.0625rem] leading-relaxed text-dark">
                {submission.feedback_coach}
              </p>
            )}
          </div>
        )}
      </PremiumCard>

      {/* Historique */}
      {previousSubmissions.length > 0 && (
        <PremiumCard
          title={`Tentatives précédentes · ${previousSubmissions.length}`}
          subtitle="Autres soumissions pour cette mission"
        >
          <ol className="space-y-4">
            {previousSubmissions.map((previous) => (
              <li
                key={previous.id}
                className="relative pl-6 border-l-2 border-dark/8 last:border-l-0 pb-4 last:pb-0"
              >
                <span
                  className={`absolute left-[-5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 ${
                    previous.statut === "valide"
                      ? "border-success bg-success"
                      : previous.statut === "a_corriger"
                      ? "border-error bg-error"
                      : "border-ochre bg-paper"
                  }`}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={STATUT_TONE[previous.statut]}>
                    {STATUT_LABELS[previous.statut]}
                  </Badge>
                  <span className="text-xs text-secondary">
                    {formatDateTime(previous.created_at)}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-dark">
                  {previous.contenu}
                </p>
                {previous.feedback_coach && (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-secondary italic">
                    Retour : {previous.feedback_coach}
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
