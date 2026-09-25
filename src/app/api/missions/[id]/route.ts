import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const missionId = searchParams.get("id");

  if (!missionId) {
    return NextResponse.json({ error: "Mission ID requis" }, { status: 400 });
  }

  const supabase = createClient();

  // Query missions with service role (bypasses RLS)
  const { data: mission, error: missionError } = await supabase
    .from("missions")
    .select(`
      id,
      number,
      title,
      objective,
      estimated_duration_minutes,
      stages(number, title)
    `)
    .eq("id", missionId)
    .maybeSingle();

  if (missionError || !mission) {
    return NextResponse.json({ notFound: true }, { status: 404 });
  }

  // Get user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Get mission progress
  const { data: progress } = await supabase
    .from("mission_progress")
    .select("id, status")
    .eq("profile_id", user.id)
    .eq("mission_id", missionId)
    .maybeSingle();

  // Get submissions
  let submissions: Array<{ id: string; contenu: string; statut: string; feedback_coach: string | null; created_at: string; updated_at: string }> = [];
  if (progress) {
    const { data: subs } = await supabase
      .from("mission_submissions")
      .select("id, contenu, statut, feedback_coach, created_at, updated_at")
      .eq("mission_progress_id", progress.id)
      .order("created_at", { ascending: false });
    submissions = subs ?? [];
  }

  return NextResponse.json({
    mission,
    progress,
    submissions,
  });
}
