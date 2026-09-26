import Link from "next/link";
import { requireAdmin } from "@/lib/cohorts/admin";
import { PremiumCard } from "@/components/app-ui/PremiumCard";
import { formatDateTime } from "@/lib/missions/format";
import { fetchParticipantNames } from "@/lib/missions/coach";
import { Inbox, Clock, CheckCircle2, XCircle } from "lucide-react";

interface PendingSubmissionRow {
  id: string;
  created_at: string;
  statut: string;
  mission_progress: {
    profile_id: string;
    missions: { number: number; title: string } | null;
  } | null;
}

export default async function AdminLivrablesPage() {
  const { supabase } = await requireAdmin();

  // Récupérer les soumissions en attente
  const { data } = await supabase
    .from("mission_submissions")
    .select("id, created_at, statut, mission_progress(profile_id, missions(number, title))")
    .eq("statut", "soumis")
    .order("created_at", { ascending: true });

  const submissions = (data ?? []) as unknown as PendingSubmissionRow[];

  // Récupérer les noms des participants
  const profileIds = submissions
    .map((s) => s.mission_progress?.profile_id)
    .filter((id): id is string => !!id);
  const nameMap = await fetchParticipantNames(supabase, profileIds);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 pb-24 sm:pb-10">
      <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ochre hover:underline">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour au dashboard
      </Link>

      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-ochre">Administration</p>
        <h1 className="t-display-mid text-[clamp(1.5rem,4vw,2.25rem)] text-dark">Livrables à revoir</h1>
        <p className="mt-2 text-secondary">
          {submissions.length === 0
            ? "Aucun livrable en attente. Votre file est vide !"
            : `${submissions.length} livrable${submissions.length > 1 ? "s" : ""} en attente de votre revue.`}
        </p>
      </div>

      {submissions.length > 0 ? (
        <PremiumCard title={`File d&apos;attente · ${submissions.length} en attente`}>
          <ol className="space-y-3">
            {submissions.map((submission, index) => {
              const mission = submission.mission_progress?.missions;
              const participantName = nameMap.get(submission.mission_progress?.profile_id ?? "") ?? "Participant";

              return (
                <li
                  key={submission.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[2px] border border-dark/6 px-4 py-3 transition-colors hover:border-ochre/30 hover:bg-paper/30"
                >
                  <div className="flex items-center gap-4">
                    <span className="t-chiffre text-sm text-ochre">#{index + 1}</span>
                    <div>
                      <p className="font-semibold text-dark">{participantName}</p>
                      <p className="text-sm text-secondary">
                        Mission {mission?.number ?? "?"} · {mission?.title ?? "Mission inconnue"}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-secondary">
                        <Clock className="h-3 w-3" />
                        Soumis le {formatDateTime(submission.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-1 text-xs ${submission.statut === "soumis" ? "bg-ochre/10 text-ochre" : "bg-secondary/10 text-secondary"}`}>
                      {submission.statut === "soumis" ? "En attente" : submission.statut}
                    </span>
                    <Link
                      href={`/coach/${submission.id}`}
                      className="rounded-[2px] bg-gold px-4 py-2 text-sm font-semibold text-ink transition-all hover:bg-amber hover:shadow-[0_0_16px_rgba(240,185,40,0.3)]"
                    >
                      Revoir →
                    </Link>
                  </div>
                </li>
              );
            })}
          </ol>
        </PremiumCard>
      ) : (
        <PremiumCard className="text-center py-12">
          <Inbox className="mx-auto mb-4 h-12 w-12 text-secondary/30" />
          <p className="text-lg font-semibold text-dark">Tout est à jour !</p>
          <p className="mt-1 text-sm text-secondary">Aucun livrable en attente de revue.</p>
        </PremiumCard>
      )}
    </div>
  );
}
