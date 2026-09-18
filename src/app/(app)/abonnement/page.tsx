import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { PLANS, formatXof, type PlanKey } from "@/lib/subscriptions/plans";
import { SubscribeButton } from "@/components/subscriptions/SubscribeButton";

export default async function AbonnementPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: activeSubscription } = await supabase
    .from("subscriptions")
    .select("plan, expires_at")
    .eq("profile_id", user.id)
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="t-display-mid text-3xl text-dark">Abonnement</h1>
      <p className="mb-8 text-secondary">
        {activeSubscription
          ? `Palier ${PLANS[activeSubscription.plan as PlanKey].name}, actif jusqu'au ${new Date(
              activeSubscription.expires_at
            ).toLocaleDateString("fr-FR")}.`
          : "Choisissez un palier pour accéder à votre Parcours."}
      </p>

      <div className="flex flex-col gap-4">
        {Object.values(PLANS).map((plan) => (
          <Card key={plan.key} title={plan.name}>
            <p className="mb-4 text-lg font-semibold text-dark">{formatXof(plan.amountXof)} / mois</p>
            <SubscribeButton plan={plan.key} />
          </Card>
        ))}
      </div>
    </div>
  );
}
