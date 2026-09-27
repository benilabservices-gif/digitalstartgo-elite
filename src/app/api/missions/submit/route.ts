import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendSubmissionReceivedEmail, sendCoachNotificationEmail } from "@/lib/email";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    missionId?: string;
    missionProgressId?: string;
    contenu?: string;
    reponses?: Record<string, string | string[]>;
    isCorrection?: boolean;
  } | null;

  if (!body || (!body.contenu && !body.reponses)) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  let progressId = body.missionProgressId;

  if (!progressId && body.missionId) {
    const { data: existing } = await supabase
      .from("mission_progress")
      .select("id")
      .eq("mission_id", body.missionId)
      .eq("profile_id", user.id)
      .maybeSingle();

    if (existing?.id) {
      progressId = existing.id;
    } else {
      const { data: created } = await supabase
        .from("mission_progress")
        .insert({ mission_id: body.missionId, profile_id: user.id })
        .select("id")
        .single();
      progressId = created?.id;
    }
  }

  if (!progressId) {
    return NextResponse.json({ error: "Impossible de créer la progression" }, { status: 400 });
  }

  const contenu = body.contenu ?? (body.reponses ? JSON.stringify(body.reponses, null, 2) : "");

  const { data: sub, error: subError } = await supabase
    .from("mission_submissions")
    .insert({
      mission_progress_id: progressId,
      contenu,
      reponses: body.reponses ?? null,
      statut: "soumis",
    })
    .select("id")
    .single();

  if (subError) {
    console.error("[api/missions/submit] error:", subError.message);
    return NextResponse.json({ error: "Échec de la soumission" }, { status: 500 });
  }

  const submissionId = sub.id;

  try {
    await sendSubmissionReceivedEmail(submissionId);
  } catch (err: any) {
    console.error("[api/missions/submit] email error:", err?.message);
  }

  try {
    await sendCoachNotificationEmail(submissionId);
  } catch (err: any) {
    console.error("[api/missions/submit] coach email error:", err?.message);
  }

  return NextResponse.json({ id: submissionId, success: true });
}
