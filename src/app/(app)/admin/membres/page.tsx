import Link from "next/link";
import { requireAdmin } from "@/lib/cohorts/admin";
import { PremiumCard } from "@/components/app-ui/PremiumCard";
import { Badge } from "@/components/ui/Badge";
import { Users, CheckCircle2, XCircle } from "lucide-react";

export default async function AdminMembresPage() {
  const { supabase } = await requireAdmin();

  // Utiliser la fonction SQL admin_list_members()
  const { data: membersData } = await supabase.rpc("admin_list_members");
  const rows = (membersData ?? []) as Array<{
    id: string;
    email: string;
    full_name: string | null;
    business_name: string | null;
    role: string;
    cohort_id: string | null;
    subscription_active: boolean;
  }>;

  // Récupérer les noms des cohortes
  const { data: cohortsData } = await supabase
    .from("cohorts")
    .select("id, name");
  const cohortMap = new Map((cohortsData ?? []).map((c: any) => [c.id, c.name]));

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 pb-24 sm:pb-10">
      <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ochre hover:underline">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour au dashboard
      </Link>

      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-ochre">Administration</p>
        <h1 className="t-display-mid text-[clamp(1.5rem,4vw,2.25rem)] text-dark">Membres</h1>
        <p className="mt-2 text-secondary">
          Liste de tous les comptes inscrits sur la plateforme.
        </p>
      </div>

      <PremiumCard
        title={`Tous les membres · ${rows.length}`}
        subtitle={rows.length === 0 ? "Aucun membre inscrit pour l'instant." : undefined}
      >
        {rows.length === 0 ? (
          <div className="py-8 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-secondary/30" />
            <p className="text-sm text-secondary">Aucun membre pour l'instant.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark/10">
                  <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-secondary">Utilisateur</th>
                  <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-secondary">Rôle</th>
                  <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-secondary">Cohorte</th>
                  <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-secondary">Abonnement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark/5">
                {rows.map((row) => (
                  <tr key={row.id} className="group hover:bg-paper/30">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-[0.6875rem] font-bold text-paper">
                          {(row.business_name ?? row.full_name ?? row.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-dark">
                            {row.business_name ?? row.full_name ?? "—"}
                          </p>
                          <p className="text-xs text-secondary">{row.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge tone={row.role === "admin" ? "danger" : row.role === "coach" ? "warning" : "default"}>
                        {row.role || "participant"}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-secondary">
                      {row.cohort_id ? (cohortMap.get(row.cohort_id) ?? "—") : "—"}
                    </td>
                    <td className="py-3 pr-4">
                      {row.subscription_active ? (
                        <span className="flex items-center gap-1 text-xs text-success">
                          <CheckCircle2 className="h-3 w-3" />
                          Actif
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-secondary">
                          <XCircle className="h-3 w-3" />
                          Non
                        </span>
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
