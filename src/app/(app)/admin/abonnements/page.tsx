import { requireAdmin } from "@/lib/cohorts/admin";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GrantSubscriptionButton } from "@/components/admin/GrantSubscriptionButton";
import type { ProfileForAssignment } from "@/lib/cohorts/types";

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

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="t-display-mid text-3xl text-dark">Abonnements</h1>
      <p className="mb-8 text-secondary">
        Accorder un accès de test sans paiement réel, ou voir qui est déjà abonné.
      </p>

      <Card title="Participants">
        <ul className="flex flex-col gap-4">
          {profiles.length === 0 ? (
            <li className="text-sm text-secondary">Aucun participant pour l&apos;instant.</li>
          ) : (
            profiles.map((profile) => {
              const active = activeByProfile.get(profile.id);
              return (
                <li
                  key={profile.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-dark/5 pb-4 last:border-none last:pb-0"
                >
                  <div>
                    <p className="font-semibold text-dark">
                      {profile.business_name ?? profile.full_name ?? profile.id}
                    </p>
                    {active ? (
                      <Badge tone="success">
                        {active.plan} — actif jusqu&apos;au {new Date(active.expires_at).toLocaleDateString("fr-FR")}
                      </Badge>
                    ) : (
                      <Badge tone="warning">Aucun abonnement actif</Badge>
                    )}
                  </div>
                  <GrantSubscriptionButton profileId={profile.id} />
                </li>
              );
            })
          )}
        </ul>
      </Card>
    </div>
  );
}
