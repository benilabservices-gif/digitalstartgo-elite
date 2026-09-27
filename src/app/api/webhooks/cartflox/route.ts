import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { verifyCartfloxSignature } from "@/lib/subscriptions/webhook";
import { PLANS, type PlanKey } from "@/lib/subscriptions/plans";

const SUBSCRIPTION_DURATION_DAYS = 30;

interface CartfloxWebhookPayload {
  event: string;
  data: {
    order_id?: string;
    amount?: number;
    currency?: string;
    metadata?: {
      profile_id?: string;
      plan?: string;
      mode?: string;
      echeance?: number | null;
    };
  };
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  const isValid = verifyCartfloxSignature(
    rawBody,
    request.headers.get("x-afriflow-timestamp"),
    request.headers.get("x-afriflow-signature"),
    process.env.CARTFLOX_SECRET_KEY!
  );

  if (!isValid) {
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  const payload = JSON.parse(rawBody) as CartfloxWebhookPayload;

  if (payload.event !== "payment.completed") {
    return NextResponse.json({ received: true });
  }

  const profileId = payload.data.metadata?.profile_id;
  const plan = payload.data.metadata?.plan;
  const mode = payload.data.metadata?.mode === "une_fois" ? "une_fois" : "mensuel";
  // Les métadonnées peuvent revenir en texte ("2") : on force un nombre entre 1 et 3.
  const echeanceBrute = Number(payload.data.metadata?.echeance ?? 1);
  const echeance = mode === "une_fois" ? null : Math.min(Math.max(Number.isFinite(echeanceBrute) ? echeanceBrute : 1, 1), 3);
  const orderId = payload.data.order_id;

  if (!profileId || !plan || !orderId) {
    return NextResponse.json({ error: "Métadonnées manquantes." }, { status: 400 });
  }

  // Validate plan and mode
  if (!PLANS[plan as PlanKey]) {
    return NextResponse.json({ error: "Plan inconnu." }, { status: 400 });
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date();

  let expiresAt: string;
  let engagementFin: string;
  const modePaiement = mode;

  if (mode === "une_fois") {
    expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
    engagementFin = expiresAt;
  } else {
    // Monthly mode
    if (echeance === 1) {
      expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      engagementFin = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      // Echeance 2 or 3: extend from old engagement end date
      const { data: lastSub } = await supabase
        .from("subscriptions")
        .select("engagement_fin, expires_at")
        .eq("profile_id", profileId)
        .neq("mode_paiement", "admin")
        .order("engagement_fin", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastSub && lastSub.engagement_fin) {
        const oldEngagementFin = new Date(lastSub.engagement_fin);
        const oldExpiresAt = new Date(lastSub.expires_at);
        const nowTime = now.getTime();

        if (oldEngagementFin > new Date(nowTime)) {
          // Engagement en cours : +30 jours à partir de l'ancienne fin, ou d'aujourd'hui
          // si le client paie en retard (il ne perd pas de jours payés).
          const base = Math.max(oldExpiresAt.getTime(), nowTime);
          expiresAt = new Date(base + 30 * 24 * 60 * 60 * 1000).toISOString();
        } else {
          // Engagement expired - start fresh
          expiresAt = new Date(nowTime + 30 * 24 * 60 * 60 * 1000).toISOString();
        }
        // engagement_fin stays unchanged
        engagementFin = lastSub.engagement_fin;
      } else {
        expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
        engagementFin = expiresAt;
      }
    }
  }

  // Check if record already exists for this order_id (idempotency)
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("cartflox_order_id", orderId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ received: true });
  }

  // Insert or update the subscription
  const { error: upsertError } = await supabase.from("subscriptions").upsert(
    {
      profile_id: profileId,
      plan: plan,
      cartflox_order_id: orderId,
      amount: payload.data.amount ?? 0,
      currency: payload.data.currency ?? "XOF",
      expires_at: expiresAt,
      mode_paiement: modePaiement,
      echeance: echeance,
      engagement_fin: engagementFin,
    },
    { onConflict: "cartflox_order_id", ignoreDuplicates: true }
  );

  if (upsertError) {
    console.error("[webhook/cartflox] upsert error:", upsertError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  try {
    const { sendPaymentConfirmedEmail, sendNewSaleEmail } = await import("@/lib/email");
    await sendPaymentConfirmedEmail(profileId, orderId);
    await sendNewSaleEmail(profileId, orderId);
  } catch (err: any) {
    console.error("[webhook/cartflox] email error:", err?.message);
  }

  return NextResponse.json({ received: true });
}
