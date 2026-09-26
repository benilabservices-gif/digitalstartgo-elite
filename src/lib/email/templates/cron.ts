import { sendEmail, SITE_URL } from "../index";
import { PLANS, type PlanKey } from "@/lib/subscriptions/plans";
import { createServiceClient } from "@/lib/supabase/server";

export async function sendLateSubmissionsEmail(): Promise<void> {
  const supabase = createServiceClient();

  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const { data: lateSubs } = await supabase
    .from("mission_submissions")
    .select(`
      id, statut, created_at,
      mission_progress(profile_id, missions(code, stages(number)))
    `)
    .eq("statut", "soumis")
    .order("created_at", { ascending: true });

  if (!lateSubs || lateSubs.length === 0) return;

  const overdue: Array<{
    submissionId: string;
    profileId: string;
    missionCode: string;
    plan: string;
    hoursOverdue: number;
    coachName: string | null;
  }> = [];

  for (const sub of lateSubs) {
    const created = new Date((sub as any).created_at);
    const profileId = (sub as any).mission_progress?.profile_id;
    if (!profileId) continue;

    const [{ data: subRow }] = await Promise.all([
      supabase.from("subscriptions").select("plan").eq("profile_id", profileId).gt("expires_at", now.toISOString()).order("expires_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    const planKey: PlanKey = ((subRow as any)?.plan ?? "starter") as PlanKey;
    const delai = PLANS[planKey]?.delaiRetourHeures ?? 72;
    const hoursOverdue = Math.round((now.getTime() - created.getTime()) / 3600000 - delai);

    if (hoursOverdue > 0) {
      let coachName: string | null = null;
      const [{ data: profile }] = await Promise.all([
        supabase.from("profiles").select("full_name, business_name, cohort_id").eq("id", profileId).maybeSingle(),
      ]);
      if ((profile as any)?.cohort_id) {
        const { data: coaches } = await supabase
          .from("cohort_coaches")
          .select("coach_id")
          .eq("cohort_id", (profile as any).cohort_id);
        const coachIds = (coaches ?? []).map((c: any) => c.coach_id);
        if (coachIds.length > 0) {
          const { data: cp } = await supabase
            .from("profiles")
            .select("full_name, business_name")
            .in("id", coachIds);
          coachName = (cp?.[0]?.full_name ?? cp?.[0]?.business_name) ?? null;
        }
      }
      overdue.push({
        submissionId: sub.id,
        profileId,
        missionCode: ((sub as any).mission_progress?.missions?.code) ?? "?",
        plan: planKey,
        hoursOverdue,
        coachName,
      });
    }
  }

  if (overdue.length === 0) return;

  const findAdmins = async (): Promise<string[]> => {
    const { data: admins } = await supabase.from("profiles").select("email").eq("role", "admin");
    return (admins ?? []).map((a: any) => a.email).filter(Boolean);
  };

  const recipients = await findAdmins();
  if (recipients.length === 0) return;

  const subject = `${overdue.length} livrable(s) en retard de relecture`;

  const rows = overdue
    .map(
      (o) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#1a1a2e;font-size:14px;">${o.profileId.slice(0, 8)}…</td><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#1a1a2e;font-size:14px;">${o.plan}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#1a1a2e;font-size:14px;">${o.missionCode}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#e53e3e;font-size:14px;font-weight:600;">${o.hoursOverdue} h</td><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#1a1a2e;font-size:14px;">${o.coachName ?? "—"} </td></tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:system-ui,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden;">
<tr><td style="background:#1a1a2e;padding:32px 32px 24px;text-align:center;">
<h1 style="color:#f5c518;margin:0;font-size:22px;font-weight:700;">${subject}</h1>
</td></tr>
<tr><td style="padding:32px;">
<table style="width:100%;border-collapse:collapse;margin:16px 0;">
<thead><tr>
<th style="padding:8px 12px;text-align:left;color:#666;font-size:12px;font-weight:600;text-transform:uppercase;border-bottom:2px solid #eee;">Participant</th>
<th style="padding:8px 12px;text-align:left;color:#666;font-size:12px;font-weight:600;text-transform:uppercase;border-bottom:2px solid #eee;">Plan</th>
<th style="padding:8px 12px;text-align:left;color:#666;font-size:12px;font-weight:600;text-transform:uppercase;border-bottom:2px solid #eee;">Mission</th>
<th style="padding:8px 12px;text-align:left;color:#666;font-size:12px;font-weight:600;text-transform:uppercase;border-bottom:2px solid #eee;">Retard</th>
<th style="padding:8px 12px;text-align:left;color:#666;font-size:12px;font-weight:600;text-transform:uppercase;border-bottom:2px solid #eee;">Coach</th>
</tr></thead>
<tbody>${rows}</tbody>
</table>
<table role="presentation" cellpadding="0" cellspacing="0">
<tr><td align="center">
<a href="${SITE_URL}/admin/livrables" style="background:#f5c518;color:#1a1a2e;padding:14px 32px;text-decoration:none;font-weight:700;font-size:15px;border-radius:4px;">Voir les livrables</a>
</td></tr>
</table>
</td></tr>
<tr><td style="background:#f0f0f0;padding:24px 32px;text-align:center;">
<p style="color:#666;font-size:13px;margin:0;">Virtuose Funnel</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = `${subject}\n\n${overdue.length} livrable(s) en retard :\n${overdue.map((o) => `- ${o.profileId.slice(0, 8)}… | ${o.plan} | ${o.missionCode} | ${o.hoursOverdue}h de retard | Coach: ${o.coachName ?? "non assigné"}`).join("\n")}\n\n${SITE_URL}/admin/livrables`;

  for (const to of recipients) {
    await sendEmail({ to, type: "late_submissions", ref: `daily_${today}`, subject, html, text });
  }
}
