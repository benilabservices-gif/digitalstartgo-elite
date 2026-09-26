import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    business_name?: string;
    full_name?: string;
  } | null;

  const updates: Record<string, unknown> = {
    onboarding_completed: true,
    updated_at: new Date().toISOString(),
  };

  if (body?.business_name) updates.business_name = body.business_name;
  if (body?.full_name) updates.full_name = body.full_name;

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, ...updates });

  if (error) {
    console.error("[api/onboarding/complete] error:", error.message);
    return NextResponse.json({ error: "Échec de l'enregistrement" }, { status: 500 });
  }

  try {
    await sendWelcomeEmail(user.id);
  } catch (err: any) {
    console.error("[api/onboarding/complete] email error:", err?.message);
  }

  return NextResponse.json({ success: true });
}
