import Link from "next/link";
import { fetchParticipantNames, requireCoach } from "@/lib/missions/coach";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/missions/format";

interface PendingSubmissionRow {
  id: string;
  created_at: string;
  mission_progress: {
    profile_id: string;
    missions: { number: number; title: string } | null;
  } | null;
}

export default async function CoachQueuePage() {
  const { supabase } = await requireCoach();

  const { data } = await supabase
    .from("mission_submissions")
    .select("id, created_at, mission_progress(profile_id, missions(number, title))")
    .eq("statut", "soumis")
    .order("created_at", { ascending: true });

  const submissions = (data ?? []) as unknown as PendingSubmissionRow[];

  // Le nom du participant passe par une fonction dédiée : les coachs n'ont pas
  // d'accès direct en lecture à la table profiles.
  const names = await fetchParticipantNames(
    supabase,
    submissions.map((submission) => submission.mission_progress?.profile_id)
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <p className="text-sm font-semibold uppercase tracking-widest text-ochre">Espace coach</p>
      <h1 className="text-3xl font-extrabold text-dark">Livrables à revoir</h1>
      <p className="mb-8 text-secondary">
        {submissions.length === 0
          ? "Aucun livrable en attente."
          : `${submissions.length} livrable${submissions.length > 1 ? "s" : ""} en attente de votre revue.`}
      </p>

      {submissions.length > 0 && (
        <Card>
          <ol className="flex flex-col gap-4">
            {submissions.map((submission) => {
              const mission = submission.mission_progress?.missions;
              const profileId = submission.mission_progress?.profile_id;
              const participant =
                (profileId ? names.get(profileId) : null) ?? "Participant sans nom";
              return (
                <li
                  key={submission.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-dark/5 pb-4 last:border-none last:pb-0"
                >
                  <div>
                    <p className="font-semibold text-dark">{participant}</p>
                    <p className="text-sm text-secondary">
                      Mission {mission?.number ?? "?"} · {mission?.title ?? "Mission inconnue"}
                    </p>
                    <p className="text-xs text-secondary">
                      Soumis le {formatDateTime(submission.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone="warning">En attente</Badge>
                    <Link
                      href={`/coach/${submission.id}`}
                      className="text-sm font-semibold text-ochre hover:underline"
                    >
                      Revoir →
                    </Link>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>
      )}
    </div>
  );
}
