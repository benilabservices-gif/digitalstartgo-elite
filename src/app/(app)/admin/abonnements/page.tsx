import { requireAdmin } from "@/lib/cohorts/admin";
import { PremiumCard } from "@/components/app-ui/PremiumCard";
import { Badge } from "@/components/ui/Badge";
import { GrantSubscriptionButton } from "@/components/admin/GrantSubscriptionButton";
import type { ProfileForAssignment } from "@/lib/cohorts/types";
import { CreditCard, CheckCircle2, AlertCircle } from "lucide-react";

interface SubscriptionRow {
  profile_id: string;
  plan: string;
  expires_at: string;
}

export default async function AdminAbonnementsPage() {
  const { supabase } = await requireAdmin();

  const { data: profilesData } = await supabase.rpc("admin_list_profiles");
  const profiles = ((profilesData ?? []) as ProfileForAssignment[]).filter(
    (profile) => profile.role === "participant"
  );

  const { data: subscriptionsData } = await supabase
    .from("subscriptions")
    .select("profile_id, plan, expires_at")
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false });

  const activeByProfile = new Map<string, SubscriptionRow>();
  for (const row of (subscriptionsData ?? []) as SubscriptionRow[]) {
    if (!activeByProfile.has(row.profile_id)) {
      activeByProfile.set(row.profile_id, row);
    }
  }

  const activeCount = activeByProfile.size;
  const totalCount = profiles.length;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 pb-24 sm:pb-10">
      <a href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ochre hover:underline">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour au dashboard
      </a>

      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-ochre">Administration</p>
        <h1 className="t-display-mid text-[clamp(1.5rem,4vw,2.25rem)] text-dark">Abonnements</h1>
        <p className="mt-2 text-secondary">
          Accorder un accès de test sans paiement réel, ou voir qui est déjà abonné.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <PremiumCard className="text-center" glow>
          <CreditCard className="mx-auto mb-2 h-6 w-6 text-gold" />
          <p className="t-chiffre text-2xl text-dark">{activeCount}</p>
          <p className="text-xs text-secondary">Abonnements actifs</p>
        </PremiumCard>
        <PremiumCard className="text-center">
          <AlertCircle className="mx-auto mb-2 h-6 w-6 text-secondary" />
          <p className="t-chiffre text-2xl text-dark">{totalCount}</p>
          <p className="text-xs text-secondary">Total participants</p>
        </PremiumCard>
      </div>

      <PremiumCard title={`Participants · ${totalCount}`}>
        {profiles.length === 0 ? (
          <div className="py-8 text-center">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-secondary/30" />
            <p className="text-sm text-secondary">Aucun participant pour l&apos;instant.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {profiles.map((profile) => {
              const active = activeByProfile.get(profile.id);
              return (
                <li
                  key={profile.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[2px] border border-dark/6 px-4 py-3 transition-colors hover:border-ochre/25"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-[0.6875rem] font-bold text-paper">
                      {(profile.business_name ?? profile.full_name ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-dark">
                        {profile.business_name ?? profile.full_name ?? profile.id}
                      </p>
                      {active ? (
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3 w-3 text-success" />
                          <span className="text-xs text-success">
                            {active.plan} — actif jusqu&apos;au{" "}
                            {new Date(active.expires_at).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                      ) : (
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <AlertCircle className="h-3 w-3 text-error" />
                          <span className="text-xs text-error">Aucun abonnement actif</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <GrantSubscriptionButton profileId={profile.id} />
                </li>
              );
            })}
          </ul>
        )}
      </PremiumCard>
    </div>
  );
}
