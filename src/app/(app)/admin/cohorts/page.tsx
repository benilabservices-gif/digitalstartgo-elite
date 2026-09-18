import Link from "next/link";
import { requireAdmin } from "@/lib/cohorts/admin";
import { deriveCohortStatus } from "@/lib/cohorts/status";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CreateCohortForm } from "@/components/admin/CreateCohortForm";
import type { CohortRow } from "@/lib/cohorts/types";

const STATUS_LABELS = {
  a_venir: "À venir",
  en_cours: "En cours",
  terminee: "Terminée",
} as const;

export default async function AdminCohortsPage() {
  const { supabase } = await requireAdmin();

  const { data: cohorts } = await supabase
    .from("cohorts")
    .select("id, name, slug, starts_at, ends_at")
    .order("starts_at", { ascending: false });

  const rows = (cohorts ?? []) as CohortRow[];

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="t-display-mid text-3xl text-dark">Cohortes</h1>
      <p className="mb-8 text-secondary">Créer une cohorte et y rattacher participants et coachs.</p>

      <Card title="Nouvelle cohorte">
        <CreateCohortForm />
      </Card>

      <div className="mt-6">
        <Card title="Toutes les cohortes">
          {rows.length === 0 ? (
            <p className="text-secondary">Aucune cohorte pour l&apos;instant.</p>
          ) : (
            <ol className="flex flex-col gap-3">
              {rows.map((cohort) => (
                <li
                  key={cohort.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-dark/5 pb-3 last:border-none last:pb-0"
                >
                  <div>
                    <p className="font-semibold text-dark">{cohort.name}</p>
                    <p className="text-sm text-secondary">
                      Du {cohort.starts_at} au {cohort.ends_at}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone="default">{STATUS_LABELS[deriveCohortStatus(cohort.starts_at, cohort.ends_at)]}</Badge>
                    <Link
                      href={`/admin/cohorts/${cohort.id}`}
                      className="text-sm font-semibold text-ochre hover:underline"
                    >
                      Gérer →
                    </Link>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </div>
  );
}
