import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCoach } from "@/lib/missions/coach";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CoachReviewForm } from "@/components/coach/CoachReviewForm";
import { formatDateTime } from "@/lib/missions/format";
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
    profiles: { business_name: string | null } | null;
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
      "id, contenu, statut, feedback_coach, created_at, updated_at, mission_progress(id, profiles(business_name), missions(number, title, objective))"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  const submission = data as unknown as SubmissionDetailRow;
  const mission = submission.mission_progress?.missions;
  const participant = submission.mission_progress?.profiles?.business_name ?? "Participant sans nom";

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
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/coach" className="text-sm font-medium text-royal hover:underline">
        ← Retour à la file de revue
      </Link>

      <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-royal">
        Mission {mission?.number ?? "?"}
      </p>
      <h1 className="text-3xl font-extrabold text-dark">{mission?.title ?? "Mission inconnue"}</h1>
      <div className="mb-8 mt-3 flex flex-wrap items-center gap-3">
        <Badge tone={STATUT_TONE[submission.statut]}>{STATUT_LABELS[submission.statut]}</Badge>
        <span className="text-sm text-secondary">
          {participant} · soumis le {formatDateTime(submission.created_at)}
        </span>
      </div>

      {mission?.objective && (
        <Card title="Objectif attendu">
          <p className="text-dark">{mission.objective}</p>
        </Card>
      )}

      <div className="mt-6">
        <Card title="Livrable soumis">
          <p className="whitespace-pre-wrap break-words text-dark">{submission.contenu}</p>
        </Card>
      </div>

      <div className="mt-6">
        <Card title="Votre revue">
          {submission.statut === "soumis" ? (
            <CoachReviewForm submissionId={submission.id} />
          ) : (
            <>
              <p className="text-secondary">
                Cette soumission a déjà été traitée ({STATUT_LABELS[submission.statut].toLowerCase()}
                , le {formatDateTime(submission.updated_at)}).
              </p>
              {submission.feedback_coach && (
                <p className="mt-3 whitespace-pre-wrap text-dark">{submission.feedback_coach}</p>
              )}
            </>
          )}
        </Card>
      </div>

      {previousSubmissions.length > 0 && (
        <div className="mt-6">
          <Card title="Tentatives précédentes">
            <ol className="flex flex-col gap-4">
              {previousSubmissions.map((previous) => (
                <li key={previous.id} className="border-l-2 border-dark/10 pl-4">
                  <div className="flex flex-wrap items-center gap-3">
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
                    <p className="mt-2 whitespace-pre-wrap text-sm text-secondary">
                      Votre retour : {previous.feedback_coach}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </Card>
        </div>
      )}
    </div>
  );
}
