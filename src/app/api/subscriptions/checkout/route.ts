import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PLANS, type PlanKey } from "@/lib/subscriptions/plans";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { plan?: string; mode?: string } | null;
  const plan = body?.plan;
  const mode = body?.mode || "mensuel";

  if (!plan || !(plan in PLANS)) {
    return NextResponse.json({ error: "Palier invalide." }, { status: 400 });
  }

  if (mode !== "mensuel" && mode !== "une_fois") {
    return NextResponse.json({ error: "Mode de paiement invalide." }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const selected = PLANS[plan as PlanKey];
  const origin = new URL(request.url).origin;

  // Check if user has an active engagement
  const { data: activeSub } = await supabase
    .from("subscriptions")
    .select("id, plan, echeance, engagement_fin")
    .eq("profile_id", user.id)
    .gt("engagement_fin", new Date().toISOString())
    .order("engagement_fin", { ascending: false })
    .limit(1)
    .maybeSingle();

  let amount: number;
  let finalPlan = selected.key;
  let finalEcheance: number = 1;

  if (mode === "une_fois") {
    amount = selected.prixTroisMoisXof;
  } else {
    // mensuel mode
    if (activeSub && activeSub.engagement_fin && new Date(activeSub.engagement_fin) > new Date()) {
      // User has active engagement - force same plan
      if (activeSub.plan !== selected.key) {
        return NextResponse.json({ error: "Vous avez un engagement en cours sur le plan " + PLANS[activeSub.plan as PlanKey].name + ". Vous ne pouvez pas changer de plan avant la fin de votre engagement." }, { status: 400 });
      }
      // Next echeance
      finalEcheance = (activeSub.echeance ?? 0) + 1;
      if (finalEcheance > 3) finalEcheance = 3;
      amount = selected.amountXof;
    } else {
      finalEcheance = 1;
      amount = selected.amountXof;
    }
  }

  const cartfloxResponse = await fetch("https://cartflox.com/api/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CARTFLOX_SECRET_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `${user.id}-${selected.key}-${mode}-${Date.now()}`,
    },
    body: JSON.stringify({
      amount: amount,
      currency: "XOF",
      customer_email: user.email,
      description: `Virtuose Funnel — Abonnement ${selected.name} (${mode === "une_fois" ? "3 mois en une fois" : `Mensualité ${finalEcheance ?? 1}/3`})`,
      success_url: `${origin}/abonnement?statut=succes`,
      cancel_url: `${origin}/abonnement?statut=annule`,
      metadata: {
        profile_id: user.id,
        plan: finalPlan,
        mode: mode,
        echeance: finalEcheance,
      },
    }),
  });

  if (!cartfloxResponse.ok) {
    return NextResponse.json({ error: "Impossible de créer la session de paiement." }, { status: 502 });
  }

  const session = (await cartfloxResponse.json()) as { url: string };
  return NextResponse.json({ url: session.url });
}
