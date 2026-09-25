import { NextResponse } from "next/server";

export async function POST() {
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!SERVICE_ROLE_KEY || !URL) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

  // Fix RLS policies - use service role key as apikey for SQL endpoint
  const fixes = [
    `DROP POLICY IF EXISTS missions_select_authenticated ON public.missions; CREATE POLICY missions_select_authenticated ON public.missions FOR SELECT TO authenticated USING (auth.role() = 'authenticated');`,
    `DROP POLICY IF EXISTS mission_progress_select_own ON public.mission_progress; CREATE POLICY mission_progress_select_own ON public.mission_progress FOR SELECT TO authenticated USING (auth.uid() = profile_id);`,
    `DROP POLICY IF EXISTS mission_submissions_select_own ON public.mission_submissions; CREATE POLICY mission_submissions_select_own ON public.mission_submissions FOR SELECT TO authenticated USING (auth.uid() IN (SELECT profile_id FROM mission_progress) OR auth.uid() = corrige_par);`,
    `DROP POLICY IF EXISTS mission_submissions_insert_own ON public.mission_submissions; CREATE POLICY mission_submissions_insert_authenticated ON public.mission_submissions FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');`,
    `DROP POLICY IF EXISTS stages_select_authenticated ON public.stages; CREATE POLICY stages_select_authenticated ON public.stages FOR SELECT TO authenticated USING (auth.role() = 'authenticated');`,
    `DROP POLICY IF EXISTS resources_select_authenticated ON public.resources; CREATE POLICY resources_select_authenticated ON public.resources FOR SELECT TO authenticated USING (auth.role() = 'authenticated');`,
  ];

  const results = [];
  for (const sql of fixes) {
    const res = await fetch(`${URL}/rest/v1/`, {
      method: "POST",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql }),
    });
    const data = await res.json();
    results.push({ sql: sql.slice(0, 50), result: data });
    console.log("Fix result:", data);
  }

  return NextResponse.json({ success: true, results });
}
