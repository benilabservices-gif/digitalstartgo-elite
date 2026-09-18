import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { verifyCartfloxSignature } from "@/lib/subscriptions/webhook";

const SUBSCRIPTION_DURATION_DAYS = 30;

interface CartfloxWebhookPayload {
  event: string;
  data: {
    order_id?: string;
    amount?: number;
    currency?: string;
    metadata?: { profile_id?: string; plan?: string };
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
  const orderId = payload.data.order_id;

  if (!profileId || !plan || !orderId) {
    return NextResponse.json({ error: "Métadonnées manquantes." }, { status: 400 });
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const expiresAt = new Date(Date.now() + SUBSCRIPTION_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // onConflict + ignoreDuplicates : Cartflox prévient qu'un webhook peut
  // arriver deux fois. cartflox_order_id est unique, donc un doublon
  // n'insère pas un deuxième abonnement.
  await supabase.from("subscriptions").upsert(
    {
      profile_id: profileId,
      plan,
      cartflox_order_id: orderId,
      amount: payload.data.amount ?? 0,
      currency: payload.data.currency ?? "XOF",
      expires_at: expiresAt,
    },
    { onConflict: "cartflox_order_id", ignoreDuplicates: true }
  );

  return NextResponse.json({ received: true });
}
