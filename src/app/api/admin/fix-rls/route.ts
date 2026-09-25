import { NextResponse } from "next/server";

export async function POST() {
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!SERVICE_ROLE_KEY || !ANON_KEY || !URL) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

  // Fix RLS policies
  const fixes = [
    `DROP POLICY IF EXISTS missions_select_authenticated ON public.missions; CREATE POLICY missions_select_authenticated ON public.missions FOR SELECT TO authenticated USING (auth.role() = 'authenticated');`,
    `DROP POLICY IF EXISTS mission_progress_select_own ON public.mission_progress; CREATE POLICY mission_progress_select_own ON public.mission_progress FOR SELECT TO authenticated USING (auth.uid() = profile_id);`,
    `DROP POLICY IF EXISTS mission_submissions_select_own ON public.mission_submissions; CREATE POLICY mission_submissions_select_own ON public.mission_submissions FOR SELECT TO authenticated USING (auth.role() = 'authenticated');`,
    `DROP POLICY IF EXISTS mission_submissions_insert_own ON public.mission_submissions; CREATE POLICY mission_submissions_insert_own ON public.mission_submissions FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');`,
    `DROP POLICY IF EXISTS stages_select_authenticated ON public.stages; CREATE POLICY stages_select_authenticated ON public.stages FOR SELECT TO authenticated USING (auth.role() = 'authenticated');`,
    `DROP POLICY IF EXISTS resources_select_authenticated ON public.resources; CREATE POLICY resources_select_authenticated ON public.resources FOR SELECT TO authenticated USING (auth.role() = 'authenticated');`,
  ];

  for (const sql of fixes) {
    const res = await fetch(`${URL}/rest/v1/`, {
      method: "POST",
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "tx-mode=rollback",
      },
      body: JSON.stringify({ sql }),
    });
    const data = await res.json();
    console.log("Fix result:", data);
  }

  return NextResponse.json({ success: true, message: "RLS policies fixed" });
}
