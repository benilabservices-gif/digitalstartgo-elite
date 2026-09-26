import Link from "next/link";
import { requireCoach } from "@/lib/missions/coach";
import { PremiumCard } from "@/components/app-ui/PremiumCard";
import { Badge } from "@/components/ui/Badge";
import { Users, Clock, CheckCircle2, XCircle } from "lucide-react";

interface ParticipantRow {
  id: string;
  business_name: string | null;
  cohort_name: string | null;
  current_stage_number: number | null;
  current_stage_title: string | null;
  last_submission_status: string | null;
  last_submission_date: string | null;
}

export default async function CoachParticipantsPage() {
  const { supabase } = await requireCoach();

  // Utiliser la fonction SQL coach_list_participants()
  const { data: participantsData, error } = await supabase.rpc("coach_list_participants");

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10 pb-24 sm:pb-10">
        <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ochre hover:underline">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour au dashboard
        </Link>
        <PremiumCard className="text-center py-12">
          <p className="text-lg font-semibold text-error">Erreur</p>
          <p className="mt-1 text-sm text-secondary">{error.message}</p>
        </PremiumCard>
      </div>
    );
  }

  const rows = (participantsData ?? []) as ParticipantRow[];

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 pb-24 sm:pb-10">
      <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ochre hover:underline">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour au dashboard
      </Link>

      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-ochre">Espace coach</p>
        <h1 className="t-display-mid text-[clamp(1.5rem,4vw,2.25rem)] text-dark">Mes participants</h1>
        <p className="mt-2 text-secondary">
          Suivez la progression de vos participants à travers les étapes du programme.
        </p>
      </div>

      <PremiumCard
        title={`Participants · ${rows.length}`}
        subtitle={rows.length === 0 ? "Aucun participant dans vos cohortes." : undefined}
      >
        {rows.length === 0 ? (
          <div className="py-8 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-secondary/30" />
            <p className="text-sm text-secondary">Aucun participant pour l&apos;instant.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark/10">
                  <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-secondary">Participant</th>
                  <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-secondary">Cohorte</th>
                  <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-secondary">Étape actuelle</th>
                  <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-secondary">Dernier livrable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark/5">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-paper/30">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-[0.6875rem] font-bold text-paper">
                          {(row.business_name ?? "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-dark">
                            {row.business_name ?? "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-secondary">
                      {row.cohort_name ?? "—"}
                    </td>
                    <td className="py-3 pr-4">
                      {row.current_stage_number ? (
                        <Badge tone="default">
                          Étape {row.current_stage_number} — {row.current_stage_title ?? ""}
                        </Badge>
                      ) : (
                        <span className="text-xs text-secondary">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {row.last_submission_date ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-secondary">
                            {new Date(row.last_submission_date).toLocaleDateString("fr-FR")}
                          </span>
                          {row.last_submission_status === "valide" ? (
                            <CheckCircle2 className="h-3 w-3 text-success" />
                          ) : row.last_submission_status === "rejete" ? (
                            <XCircle className="h-3 w-3 text-error" />
                          ) : (
                            <Clock className="h-3 w-3 text-ochre" />
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-secondary">Aucun</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PremiumCard>
    </div>
  );
}
