import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email";

// Appelée par la page d'onboarding après l'enregistrement du profil :
// envoie l'email de bienvenue (une seule fois par compte, via email_log).
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed) {
    return NextResponse.json({ error: "Onboarding non terminé" }, { status: 400 });
  }

  await sendWelcomeEmail(user.id);
  return NextResponse.json({ success: true });
}
