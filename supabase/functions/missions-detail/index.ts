import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user from cookie
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { missionId } = await req.json();
    if (!missionId) {
      return new Response(
        JSON.stringify({ error: "missionId requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Query with service role — bypasses RLS
    const { data: mission, error: missionError } = await supabaseClient
      .from("missions")
      .select("id, number, title, objective, estimated_duration_minutes, stages(number, title)")
      .eq("id", missionId)
      .maybeSingle();

    if (missionError || !mission) {
      return new Response(
        JSON.stringify({ notFound: true }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: progress } = await supabaseClient
      .from("mission_progress")
      .select("id, status")
      .eq("profile_id", user.id)
      .eq("mission_id", missionId)
      .maybeSingle();

    let submissions: any[] = [];
    if (progress) {
      const { data: subs } = await supabaseClient
        .from("mission_submissions")
        .select("id, contenu, statut, feedback_coach, created_at, updated_at")
        .eq("mission_progress_id", progress.id)
        .order("created_at", { ascending: false });
      submissions = subs ?? [];
    }

    return new Response(
      JSON.stringify({ mission, progress, submissions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
