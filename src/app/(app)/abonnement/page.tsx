import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PremiumCard } from "@/components/app-ui/PremiumCard";
import { PLANS, formatXof, type PlanKey } from "@/lib/subscriptions/plans";
import { SubscribeButton } from "@/components/subscriptions/SubscribeButton";
import { Check, Crown, Star } from "lucide-react";

export default async function AbonnementPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: activeSubscription } = await supabase
    .from("subscriptions")
    .select("plan, expires_at")
    .eq("profile_id", user.id)
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 pb-24 sm:pb-10">
      <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ochre hover:underline">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour au dashboard
      </Link>

      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-ochre">Abonnement</p>
        <h1 className="t-display-mid text-[clamp(1.5rem,4vw,2.25rem)] text-dark">
          Choisissez votre palier
        </h1>
        <p className="mt-2 text-secondary">
          {activeSubscription
            ? `Palier ${PLANS[activeSubscription.plan as PlanKey].name}, actif jusqu&apos;au ${new Date(activeSubscription.expires_at).toLocaleDateString("fr-FR")}.`
            : "Choisissez un palier pour accéder à votre Parcours."}
        </p>
      </div>

      {/* Active subscription card */}
      {activeSubscription && (
        <PremiumCard glow className="mb-6 border-l-[3px] border-l-gold">
          <div className="flex items-center gap-3">
            <Crown className="h-6 w-6 text-gold" />
            <div>
              <p className="font-semibold text-dark">
                Abonnement actif — {PLANS[activeSubscription.plan as PlanKey].name}
              </p>
              <p className="text-sm text-secondary">
                Valide jusqu&apos;au {new Date(activeSubscription.expires_at).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>
        </PremiumCard>
      )}

      {/* Plans */}
      <div className="space-y-4">
        {Object.values(PLANS).map((plan) => (
          <PremiumCard
            key={plan.key}
            title={plan.name}
            subtitle={plan.key === "pro" ? "Le plus populaire" : plan.key === "elite" ? "L'accompagnement premium" : "Pour démarrer"}
            className={plan.key === "pro" ? "border-gold/30 shadow-[0_8px_32px_rgba(240,185,40,0.15)]" : ""}
          >
            <div className="flex items-end justify-between">
              <p className="t-chiffre text-2xl text-dark">{formatXof(plan.amountXof)}</p>
              <p className="text-sm text-secondary">/ mois</p>
            </div>

            <ul className="mt-4 space-y-2">
              {plan.key === "starter" && [
                "Accès au parcours en 8 étapes",
                "Ressources et templates",
                "Communauté",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-secondary">
                  <Check className="h-4 w-4 text-gold shrink-0" />
                  {item}
                </li>
              ))}
              {plan.key === "pro" && [
                "Tout Starter inclus",
                "Coaching avec feedback sur chaque mission",
                "Accès à Virtuose AI",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-secondary">
                  <Check className="h-4 w-4 text-gold shrink-0" />
                  {item}
                </li>
              ))}
              {plan.key === "elite" && [
                "Tout Pro inclus",
                "Sessions de coaching individuelles",
                "Revue prioritaire des livrables",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-secondary">
                  <Check className="h-4 w-4 text-gold shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <SubscribeButton plan={plan.key} />
          </PremiumCard>
        ))}
      </div>
    </div>
  );
}
