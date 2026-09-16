import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
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

  if (!user) {
    redirect("/login");
  }

  const { data: mission } = await supabase
    .from("missions")
    .select("id, number, title, objective, estimated_duration_minutes, stages(number, title)")
    .eq("id", params.id)
    .maybeSingle();

  if (!mission) {
    notFound();
  }

  // PostgREST renvoie un objet (et non un tableau) pour une relation
  // plusieurs-vers-un ; le client Supabase non typé ne peut pas le déduire.
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

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/dashboard" className="text-sm font-medium text-ochre hover:underline">
        ← Retour à mon parcours
      </Link>

      <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-ochre">
        Étape {missionRow.stages?.number ?? missionRow.number} ·{" "}
        {missionRow.stages?.title ?? "Mon Parcours"}
      </p>
      <h1 className="text-3xl font-extrabold text-dark">{missionRow.title}</h1>
      <div className="mb-8 mt-3 flex items-center gap-3">
        <Badge tone={MISSION_STATUS_TONE[status]}>{MISSION_STATUS_LABELS[status]}</Badge>
        <span className="text-sm text-secondary">
          Durée estimée : {missionRow.estimated_duration_minutes} min
        </span>
      </div>

      <Card title="Objectif de la mission">
        <p className="text-dark">{missionRow.objective}</p>
      </Card>

      <div className="mt-6">
        <Card title="Ressources">
          <p className="text-secondary">
            Ressources bientôt disponibles. En attendant, appuyez-vous sur l&apos;objectif
            ci-dessus et sur les retours de votre coach.
          </p>
        </Card>
      </div>

      {lastSubmission?.feedback_coach && (
        <div className="mt-6">
          <Card title="Retour de votre coach">
            <p className="whitespace-pre-wrap text-dark">{lastSubmission.feedback_coach}</p>
            <p className="mt-3 text-xs text-secondary">
              Reçu le {formatDateTime(lastSubmission.updated_at)}
            </p>
          </Card>
        </div>
      )}

      <div className="mt-6">
        <Card title={status === "a_corriger" ? "Renvoyer mon livrable" : "Soumettre mon livrable"}>
          {canSubmitMission(status) ? (
            <MissionSubmissionForm
              missionId={missionRow.id}
              missionProgressId={progress?.id ?? null}
              isCorrection={status === "a_corriger"}
            />
          ) : (
            <p className="text-secondary">{blockedReason}</p>
          )}
        </Card>
      </div>

      {submissions.length > 0 && (
        <div className="mt-6">
          <Card title="Historique de mes soumissions">
            <ol className="flex flex-col gap-4">
              {submissions.map((submission) => (
                <li
                  key={submission.id}
                  className="border-l-2 border-dark/10 pl-4"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge tone={SUBMISSION_TONE[submission.statut]}>
                      {SUBMISSION_LABELS[submission.statut]}
                    </Badge>
                    <span className="text-xs text-secondary">
                      Soumis le {formatDateTime(submission.created_at)}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-dark">
                    {submission.contenu}
                  </p>
                  {submission.feedback_coach && (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-secondary">
                      Coach : {submission.feedback_coach}
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
