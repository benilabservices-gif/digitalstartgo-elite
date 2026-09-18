import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PLANS, type PlanKey } from "@/lib/subscriptions/plans";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { plan?: string } | null;
  const plan = body?.plan;

  if (!plan || !(plan in PLANS)) {
    return NextResponse.json({ error: "Palier invalide." }, { status: 400 });
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

  const cartfloxResponse = await fetch("https://cartflox.com/api/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CARTFLOX_SECRET_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `${user.id}-${selected.key}-${Date.now()}`,
    },
    body: JSON.stringify({
      amount: selected.amountXof,
      currency: "XOF",
      customer_email: user.email,
      description: `Virtuose Funnel — Abonnement ${selected.name}`,
      success_url: `${origin}/abonnement?statut=succes`,
      cancel_url: `${origin}/abonnement?statut=annule`,
      metadata: { profile_id: user.id, plan: selected.key },
    }),
  });

  if (!cartfloxResponse.ok) {
    return NextResponse.json({ error: "Impossible de créer la session de paiement." }, { status: 502 });
  }

  const session = (await cartfloxResponse.json()) as { url: string };
  return NextResponse.json({ url: session.url });
}
