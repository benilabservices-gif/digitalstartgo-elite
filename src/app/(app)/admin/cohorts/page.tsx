import Link from "next/link";
import { requireAdmin } from "@/lib/cohorts/admin";
import { PremiumCard } from "@/components/app-ui/PremiumCard";
import { Badge } from "@/components/ui/Badge";
import { CreateCohortForm } from "@/components/admin/CreateCohortForm";
import { deriveCohortStatus } from "@/lib/cohorts/status";
import { Plus, CalendarDays, Users, Settings } from "lucide-react";
import type { CohortRow } from "@/lib/cohorts/types";

const STATUS_LABELS = {
  a_venir: "À venir",
  en_cours: "En cours",
  terminee: "Terminée",
} as const;

const STATUS_ICONS = {
  a_venir: <CalendarDays className="h-4 w-4" />,
  en_cours: <Users className="h-4 w-4" />,
  terminee: <Settings className="h-4 w-4" />,
};

export default async function AdminCohortsPage() {
  const { supabase } = await requireAdmin();

  const { data: cohorts } = await supabase
    .from("cohorts")
    .select("id, name, slug, starts_at, ends_at")
    .order("starts_at", { ascending: false });

  const rows = (cohorts ?? []) as CohortRow[];

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
        <h1 className="t-display-mid text-[clamp(1.5rem,4vw,2.25rem)] text-dark">Cohortes</h1>
        <p className="mt-2 text-secondary">Créer une cohorte et y rattacher participants et coachs.</p>
      </div>

      {/* Créer une cohorte */}
      <PremiumCard title="Nouvelle cohorte" className="mb-6" glow>
        <CreateCohortForm />
      </PremiumCard>

      {/* Liste des cohortes */}
      <PremiumCard
        title={`Toutes les cohortes · ${rows.length}`}
        subtitle={rows.length === 0 ? "Aucune cohorte créée pour l'instant." : undefined}
      >
        {rows.length === 0 ? (
          <div className="py-8 text-center">
            <Plus className="mx-auto mb-3 h-8 w-8 text-secondary/30" />
            <p className="text-sm text-secondary">Créez votre première cohorte ci-dessus.</p>
          </div>
        ) : (
          <ol className="space-y-3">
            {rows.map((cohort) => {
              const status = deriveCohortStatus(cohort.starts_at, cohort.ends_at);
              return (
                <li
                  key={cohort.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[2px] border border-dark/6 px-4 py-4 transition-colors hover:border-ochre/25 hover:bg-paper/40"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/5 text-ochre">
                      {STATUS_ICONS[status]}
                    </span>
                    <div>
                      <p className="font-semibold text-dark">{cohort.name}</p>
                      <p className="text-sm text-secondary">
                        {cohort.starts_at} → {cohort.ends_at}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={status === "en_cours" ? "success" : status === "a_venir" ? "warning" : "default"}>
                      {STATUS_LABELS[status]}
                    </Badge>
                    <Link
                      href={`/admin/cohorts/${cohort.id}`}
                      className="text-sm font-semibold text-ochre hover:underline"
                    >
                      Gérer →
                    </Link>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </PremiumCard>
    </div>
  );
}
