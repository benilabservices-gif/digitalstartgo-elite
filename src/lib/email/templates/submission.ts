import { sendEmail, SITE_URL } from "../index";
import { getUserEmail, getEmailsForProfiles, getAdminEmails } from "../recipients";
import { PLANS, type PlanKey } from "@/lib/subscriptions/plans";
import { createServiceClient } from "@/lib/supabase/server";

export async function sendSubmissionReceivedEmail(submissionId: string): Promise<void> {
  const supabase = createServiceClient();

  const { data: sub } = await supabase
    .from("mission_submissions")
    .select("mission_progress_id, statut")
    .eq("id", submissionId)
    .maybeSingle();

  if (!sub) return;

  const { data: missionProg } = await supabase
    .from("mission_progress")
    .select("mission_id, profile_id")
    .eq("id", sub.mission_progress_id)
    .maybeSingle();

  if (!missionProg) return;

  const { data: mission } = await supabase
    .from("missions")
    .select("id, code, title, estimated_duration_minutes, stage_id")
    .eq("id", missionProg.mission_id)
    .maybeSingle();

  if (!mission) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, business_name")
    .eq("id", missionProg.profile_id)
    .maybeSingle();

  const email = profile ? await getUserEmail(profile.id) : null;
  if (!profile || !email) return;

  const { data: activeSub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("profile_id", missionProg.profile_id)
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const name = profile.full_name ?? profile.business_name ?? "Vous";
  const planKey: PlanKey = (activeSub?.plan as PlanKey) ?? "starter";
  const delai = PLANS[planKey].delaiRetourHeures;
  const subject = `Livrable reçu : mission ${mission.code}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:system-ui,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden;">
<tr><td style="background:#1a1a2e;padding:32px 32px 24px;text-align:center;">
<h1 style="color:#f5c518;margin:0;font-size:22px;font-weight:700;">Livrable reçu</h1>
</td></tr>
<tr><td style="padding:32px;">
<p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 16px;">Bonjour ${name},</p>
<p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 16px;">Votre livrable « <strong>${mission.title}</strong> » (mission ${mission.code}) est entre les mains de votre coach. Il vous répondra sous ${delai} heures.</p>
<p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 24px;">En attendant, vous pouvez relire le guide de l'étape.</p>
<table role="presentation" cellpadding="0" cellspacing="0">
<tr><td align="center">
<a href="${SITE_URL}/missions/${mission.id}" style="background:#f5c518;color:#1a1a2e;padding:14px 32px;text-decoration:none;font-weight:700;font-size:15px;border-radius:4px;">Voir ma mission</a>
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

  const text = `Bonjour ${name},\n\nVotre livrable « ${mission.title} » (mission ${mission.code}) est entre les mains de votre coach. Il vous répondra sous ${delai} heures.\n\nEn attendant, vous pouvez relire le guide de l'étape.\n\n${SITE_URL}/missions/${mission.id}\n\nL'équipe Virtuose Funnel`;

  await sendEmail({ to: email, type: "submission_received", ref: submissionId, subject, html, text });
}

export async function sendCoachNotificationEmail(submissionId: string): Promise<void> {
  const supabase = createServiceClient();

  const { data: sub } = await supabase
    .from("mission_submissions")
    .select("mission_progress_id, statut")
    .eq("id", submissionId)
    .maybeSingle();

  if (!sub) return;

  const { data: missionProg } = await supabase
    .from("mission_progress")
    .select("profile_id, mission_id")
    .eq("id", sub.mission_progress_id)
    .maybeSingle();

  if (!missionProg) return;

  const { data: mission } = await supabase
    .from("missions")
    .select("id, code, title, estimated_duration_minutes, stage_id")
    .eq("id", missionProg.mission_id)
    .maybeSingle();

  if (!mission) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, business_name, cohort_id, role")
    .eq("id", missionProg.profile_id)
    .maybeSingle();

  if (!profile) return;

  const { data: activeSub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("profile_id", missionProg.profile_id)
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const planKey: PlanKey = (activeSub?.plan as PlanKey) ?? "starter";
  const delai = PLANS[planKey].delaiRetourHeures;
  const participantName = profile.business_name ?? profile.full_name ?? "Participant";
  const isElite = planKey === "elite";
  const isCorrection = sub.statut === "a_corriger";
  const prefix = isElite ? "[Elite] " : isCorrection ? "Correction — " : "";
  const subject = `${prefix}Nouveau livrable : ${participantName}, mission ${mission.code}`;

  const findRecipients = async (): Promise<string[]> => {
    if (profile.role === "admin") {
      return getAdminEmails();
    }
    const cohortId = (profile as any).cohort_id;
    if (cohortId) {
      const { data: coaches } = await supabase
        .from("cohort_coaches")
        .select("coach_id")
        .eq("cohort_id", cohortId);
      const coachIds = (coaches ?? []).map((c: any) => c.coach_id);
      if (coachIds.length === 0) {
        return getAdminEmails();
      }
      return getEmailsForProfiles(coachIds);
    }
    return getAdminEmails();
  };

  const recipients = await findRecipients();
  if (recipients.length === 0) return;

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
<p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 16px;">Un nouveau livrable attend votre revue.</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0;">
<tr><td style="padding:8px 0;border-bottom:1px solid #eee;"><strong style="color:#666;font-size:13px;">Participant</strong></td><td style="padding:8px 0;border-bottom:1px solid #eee;color:#1a1a2e;font-size:15px;">${participantName}</td></tr>
<tr><td style="padding:8px 0;border-bottom:1px solid #eee;"><strong style="color:#666;font-size:13px;">Plan</strong></td><td style="padding:8px 0;border-bottom:1px solid #eee;color:#1a1a2e;font-size:15px;">${planKey}</td></tr>
<tr><td style="padding:8px 0;border-bottom:1px solid #eee;"><strong style="color:#666;font-size:13px;">Mission</strong></td><td style="padding:8px 0;border-bottom:1px solid #eee;color:#1a1a2e;font-size:15px;">${mission.code} — ${mission.title}</td></tr>
<tr><td style="padding:8px 0;"><strong style="color:#666;font-size:13px;">Date limite de réponse</strong></td><td style="padding:8px 0;color:#1a1a2e;font-size:15px;">Dans ${delai} heures</td></tr>
</table>
<table role="presentation" cellpadding="0" cellspacing="0">
<tr><td align="center">
<a href="${SITE_URL}/coach/${submissionId}" style="background:#f5c518;color:#1a1a2e;padding:14px 32px;text-decoration:none;font-weight:700;font-size:15px;border-radius:4px;">Relire le livrable</a>
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

  const text = `${subject}\n\nParticipant : ${participantName}\nPlan : ${planKey}\nMission : ${mission.code} — ${mission.title}\nDate limite de réponse : dans ${delai} heures\n\n${SITE_URL}/coach/${submissionId}`;

  await sendEmail({ to: recipients, type: "coach_new_submission", ref: submissionId, subject, html, text });
}
