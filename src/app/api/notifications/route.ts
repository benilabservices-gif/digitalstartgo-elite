import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data } = await supabase
    .from("notifications")
    .select("id, message, read, created_at")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const unreadCount = (data ?? []).filter((n: any) => !n.read).length;

  return NextResponse.json({
    notifications: data,
    unreadCount,
  });
}

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
    missionTitle?: string;
    feedback?: string | null;
    action?: "submitted" | "reviewed" | "corrected";
    recipientId?: string;
  } | null;

  if (!body || !body.action) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  const messages: Record<string, string> = {
    submitted: `Votre mission "${body.missionTitle ?? "livrable"}" a été soumise avec succès. Votre coach la recevra prochainement.`,
    reviewed: `Votre mission "${body.missionTitle ?? "livrable"}" a été revue par votre coach. Consultez votre espace missions pour voir le feedback.`,
    corrected: `Votre mission "${body.missionTitle ?? "livrable"}" nécessite des corrections. Votre coach vous a laissé un feedback détaillé.`,
  };

  const targetProfileId = body.recipientId ?? user.id;

  const { error } = await supabase.from("notifications").insert({
    profile_id: targetProfileId,
    message: messages[body.action] ?? "Nouvelle notification",
    read: false,
  });

  if (error) {
    console.error("Erreur insertion notification:", error);
    return NextResponse.json({ error: "Échec de l'insertion" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
