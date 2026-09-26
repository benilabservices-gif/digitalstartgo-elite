import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendMissionValidatedEmail, sendCorrectionRequestedEmail } from "@/lib/email";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    submissionId?: string;
    decision?: "valide" | "a_corriger";
    feedback?: string;
  } | null;

  if (!body?.submissionId || !body.decision) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  const trimmedFeedback = (body.feedback ?? "").trim();
  const { error } = await supabase
    .from("mission_submissions")
    .update({
      statut: body.decision,
      feedback_coach: trimmedFeedback.length > 0 ? trimmedFeedback : null,
      corrige_par: user.id,
    })
    .eq("id", body.submissionId);

  if (error) {
    console.error("[api/coach/review] error:", error.message);
    return NextResponse.json({ error: "Échec de la revue" }, { status: 500 });
  }

  try {
    if (body.decision === "valide") {
      await sendMissionValidatedEmail(body.submissionId);
    } else {
      await sendCorrectionRequestedEmail(body.submissionId);
    }
  } catch (err: any) {
    console.error("[api/coach/review] email error:", err?.message);
  }

  return NextResponse.json({ success: true });
}
