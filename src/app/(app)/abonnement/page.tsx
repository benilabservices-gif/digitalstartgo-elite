import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PremiumCard } from "@/components/app-ui/PremiumCard";
import { PLANS, formatXof, type PlanKey } from "@/lib/subscriptions/plans";
import { SubscribeButton } from "@/components/subscriptions/SubscribeButton";
import { Check, Crown, LogIn } from "lucide-react";

export default async function AbonnementPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let activeSubscription = null;
  if (user) {
    const { data } = await supabase
      .from("subscriptions")
      .select("plan, expires_at, mode_paiement, echeance, engagement_fin")
      .eq("profile_id", user.id)
      .gt("engagement_fin", new Date().toISOString())
      .order("engagement_fin", { ascending: false })
      .limit(1)
      .maybeSingle();
    activeSubscription = data;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 pb-24 sm:pb-10">
      {/* Header */}
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ochre hover:underline">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour à l&apos;accueil
      </Link>

      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-ochre">
          {user ? "Votre abonnement" : "Choisissez votre palier"}
        </p>
        <h1 className="t-display-mid text-[clamp(1.5rem,4vw,2.25rem)] text-dark">
          {user ? "Abonnement" : "Commencez votre parcours"}
        </h1>
        <p className="mt-2 text-secondary">
          {user
            ? activeSubscription
              ? activeSubscription.mode_paiement === "mensuel" && activeSubscription.echeance
                ? `Mensualité ${activeSubscription.echeance} sur 3 : ${formatXof(PLANS[activeSubscription.plan as PlanKey].amountXof)} FCFA, à régler avant le ${new Date(activeSubscription.expires_at).toLocaleDateString("fr-FR")}.`
                : `Palier ${PLANS[activeSubscription.plan as PlanKey].name}, actif jusqu&apos;au ${new Date(activeSubscription.expires_at).toLocaleDateString("fr-FR")}.`
              : "Aucun abonnement actif. Choisissez un palier pour accéder à votre Parcours."
            : "Créez un compte et choisissez le palier qui vous correspond."}
        </p>
      </div>

      {/* Active subscription banner */}
      {user && activeSubscription && activeSubscription.mode_paiement === "mensuel" && activeSubscription.echeance && (
        <PremiumCard className="mb-6 border-l-[3px] border-l-success" glow>
          <div className="flex items-center gap-3">
            <Crown className="h-6 w-6 text-success" />
            <div>
              <p className="font-semibold text-dark">
                Abonnement actif — {PLANS[activeSubscription.plan as PlanKey].name}
              </p>
              <p className="text-sm text-secondary">
                Mensualité {activeSubscription.echeance} sur 3 : {formatXof(PLANS[activeSubscription.plan as PlanKey].amountXof)} FCFA
              </p>
              <p className="text-xs text-secondary mt-1">
                À régler avant le {new Date(activeSubscription.expires_at).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>
        </PremiumCard>
      )}

      {/* Not logged in banner */}
      {!user && (
        <PremiumCard className="mb-6 border-l-[3px] border-l-gold" glow>
          <div className="flex items-center gap-3">
            <LogIn className="h-6 w-6 text-gold" />
            <div>
              <p className="font-semibold text-dark">Vous n&apos;êtes pas connecté</p>
              <p className="text-sm text-secondary">
                Connectez-vous ou créez un compte pour accéder aux plans et commencer votre parcours.
              </p>
            </div>
            <Link
              href="/login"
              className="ml-auto shrink-0 rounded-[2px] bg-gold px-4 py-2 text-sm font-semibold text-ink transition-all hover:bg-amber"
            >
              Se connecter
            </Link>
          </div>
        </PremiumCard>
      )}

      {/* Plans */}
      <div className="space-y-4">
        {Object.values(PLANS).map((plan) => {
          const economy = 3 * plan.amountXof - plan.prixTroisMoisXof;
          return (
            <PremiumCard
              key={plan.key}
              title={plan.name}
              subtitle={plan.key === "pro" ? "Le plus populaire" : plan.key === "elite" ? "L&apos;accompagnement premium" : "Pour démarrer"}
              className={plan.key === "pro" ? "border-gold/30 shadow-[0_8px_32px_rgba(240,185,40,0.15)]" : ""}
            >
              <div className="flex items-end justify-between">
                <div>
                  <p className="t-chiffre text-2xl text-dark">{formatXof(plan.amountXof)}</p>
                  <p className="text-sm text-secondary">/ mois · Engagement 3 mois</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-ochre">{formatXof(plan.prixTroisMoisXof)} en une fois</p>
                  <p className="text-xs text-secondary">Économisez {formatXof(economy)}</p>
                </div>
              </div>

              <ul className="mt-4 space-y-2">
                {plan.avantages.map((item) => {
                  const isElitePremium = plan.key === "elite" && item.includes("tunnel de vente premium");
                  return (
                    <li key={item} className={`flex items-center gap-2 text-sm ${isElitePremium ? "font-semibold text-dark" : "text-secondary"}`}>
                      <Check className="h-4 w-4 text-gold shrink-0" />
                      {item}
                    </li>
                  );
                })}
              </ul>

              {user ? (
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <Link
                    href={`/api/subscriptions/checkout?plan=${plan.key}&mode=mensuel`}
                    className={`t-meta flex-1 rounded-[3px] px-6 py-3 text-center text-[1rem] transition-all border border-dark/20 text-dark hover:border-ochre hover:text-ochre`}
                  >
                    Payer {formatXof(plan.amountXof)} FCFA / mois
                  </Link>
                  <Link
                    href={`/api/subscriptions/checkout?plan=${plan.key}&mode=une_fois`}
                    className={`t-meta flex-1 rounded-[3px] px-6 py-3 text-center text-[1rem] transition-all ${
                      plan.key === "pro"
                        ? "bg-gold text-ink hover:bg-amber hover:shadow-[0_0_24px_rgba(240,185,40,0.4)]"
                        : "border border-dark/20 text-dark hover:border-ochre hover:text-ochre"
                    }`}
                  >
                    Payer {formatXof(plan.prixTroisMoisXof)} FCFA en une fois
                  </Link>
                </div>
              ) : (
                <Link
                  href="/signup"
                  className={`t-meta mt-5 block rounded-[3px] px-6 py-3 text-center text-[1rem] transition-all ${
                    plan.key === "pro"
                      ? "bg-gold text-ink hover:bg-amber hover:shadow-[0_0_24px_rgba(240,185,40,0.4)]"
                      : "border border-dark/20 text-dark hover:border-ochre hover:text-ochre"
                  }`}
                >
                  {plan.key === "pro" ? "S'inscrire et choisir ce plan" : "S'inscrire"}
                </Link>
              )}
            </PremiumCard>
          );
        })}
      </div>
    </div>
  );
}
