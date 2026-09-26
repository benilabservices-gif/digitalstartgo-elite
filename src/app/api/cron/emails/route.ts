import { NextResponse } from "next/server";
import {
  sendInactiveReminderEmail,
  sendSubscriptionEndingSoonEmail,
  sendSubscriptionEndedEmail,
  sendLateSubmissionsEmail,
} from "@/lib/email";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date();

  const [{ data: participants }, { data: endingSoonSubs }, { data: expiredSubs }] = await Promise.all([
    supabase.from("profiles").select("id, email, rappels_email").eq("role", "participant"),
    supabase
      .from("subscriptions")
      .select("id, profile_id, expires_at")
      .gt("expires_at", now.toISOString())
      .lt("expires_at", new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from("subscriptions")
      .select("id, profile_id, expires_at")
      .lt("expires_at", now.toISOString())
      .gt("expires_at", new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const results: string[] = [];

  for (const profile of participants ?? []) {
    if (!profile.rappels_email) continue;
    try {
      await sendInactiveReminderEmail(profile.id);
      results.push(`E7 sent to ${profile.id}`);
    } catch (err: any) {
      console.error(`[cron] E7 error for ${profile.id}:`, err?.message);
    }
  }

  for (const sub of endingSoonSubs ?? []) {
    try {
      await sendSubscriptionEndingSoonEmail(sub.profile_id);
      results.push(`E8 sent to ${sub.profile_id}`);
    } catch (err: any) {
      console.error(`[cron] E8 error for ${sub.profile_id}:`, err?.message);
    }
  }

  for (const sub of expiredSubs ?? []) {
    try {
      await sendSubscriptionEndedEmail(sub.profile_id);
      results.push(`E9 sent to ${sub.profile_id}`);
    } catch (err: any) {
      console.error(`[cron] E9 error for ${sub.profile_id}:`, err?.message);
    }
  }

  try {
    await sendLateSubmissionsEmail();
    results.push("C2 sent");
  } catch (err: any) {
    console.error("[cron] C2 error:", err?.message);
  }

  return NextResponse.json({ sent: results, count: results.length });
}
