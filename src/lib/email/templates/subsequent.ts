import { sendEmail, SITE_URL } from "../index";
import { PLANS, formatXof, type PlanKey } from "@/lib/subscriptions/plans";
import { createServiceClient } from "@/lib/supabase/server";

export async function sendInactiveReminderEmail(profileId: string): Promise<void> {
  const supabase = createServiceClient();

  const [{ data: profile }, { data: activeSub }, { data: nextProg }] = await Promise.all([
    supabase.from("profiles").select("full_name, business_name, email, rappels_email").eq("id", profileId).maybeSingle(),
    supabase
      .from("subscriptions")
      .select("plan, expires_at")
      .eq("profile_id", profileId)
      .gt("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("mission_progress")
      .select("id, mission_id, status, missions(code, title, estimated_duration_minutes, stage_id, stages(number, title))")
      .eq("profile_id", profileId)
      .in("status", ["a_faire", "en_cours", "soumis", "a_corriger"])
      .order("mission_progress.missions.stages.number", { ascending: true })
      .order("mission_progress.missions.ordre", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!profile || !profile.email || !activeSub || !nextProg || !profile.rappels_email) return;

  const name = profile.full_name ?? profile.business_name ?? "Vous";
  const planKey: PlanKey = (activeSub.plan as PlanKey) ?? "starter";
  const delai = PLANS[planKey].delaiRetourHeures;
  const mission = (nextProg as any).missions;
  const duration = mission?.estimated_duration_minutes ?? 20;
  const subject = `Votre prochaine mission ne prend que ${duration} minutes`;

  const unsubscribeLink = `${SITE_URL}/api/email/unsubscribe?profile=${profileId}`;

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
<p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 16px;">Bonjour ${name},</p>
<p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 16px;">
  ${((nextProg as any).missions?.stages?.title ? `Vous êtes à l'étape ${((nextProg as any).missions?.stages?.number ?? "?")} — ${((nextProg as any).missions?.stages?.title ?? "").split(" — ")[0]}.` : "Vous êtes en cours dans votre parcours.")}
</p>
<p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 16px;">
  <strong>Mission ${mission?.code ?? "?"}</strong> — ${mission?.title ?? "Votre prochaine mission"} (${duration} min).
</p>
<p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 24px;">Bloquez ${duration} minutes aujourd'hui, votre coach vous attend.</p>
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="${SITE_URL}/missions/${mission?.code ?? "1.1"}" style="background:#f5c518;color:#1a1a2e;padding:14px 32px;text-decoration:none;font-weight:700;font-size:15px;border-radius:4px;">Reprendre ma mission</a></td></tr></table>
<p style="color:#aaa;font-size:12px;margin:24px 0 0;text-align:center;"><a href="${unsubscribeLink}" style="color:#aaa;text-decoration:underline;">Ne plus recevoir ces rappels</a></p>
</td></tr>
<tr><td style="background:#f0f0f0;padding:24px 32px;text-align:center;">
<p style="color:#666;font-size:13px;margin:0;">Virtuose Funnel</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = `Bonjour ${name},\n\n${((nextProg as any).missions?.stages?.title ? `Vous êtes à l'étape ${((nextProg as any).missions?.stages?.number ?? "?")}.` : "Vous êtes en cours dans votre parcours.")}\n\nMission ${(nextProg as any).missions?.code ?? "?"} — ${(nextProg as any).missions?.title ?? "Votre prochaine mission"} (${duration} min).\n\nBloquez ${duration} minutes aujourd'hui, votre coach vous attend.\n\n${SITE_URL}/missions/${mission?.code ?? "1.1"}\n\nNe plus recevoir ces rappels : ${unsubscribeLink}\n\nL'équipe Virtuose Funnel`;

  await sendEmail({ to: profile.email, type: "inactive_reminder", ref: `${profileId}_${new Date().toISOString().slice(0, 10)}`, subject, html, text });
}

export async function sendSubscriptionEndingSoonEmail(profileId: string): Promise<void> {
  const supabase = createServiceClient();

  const [{ data: profile }, { data: sub }] = await Promise.all([
    supabase.from("profiles").select("full_name, business_name, email").eq("id", profileId).maybeSingle(),
    supabase
      .from("subscriptions")
      .select("plan, expires_at")
      .eq("profile_id", profileId)
      .gt("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!profile || !sub || !profile.email) return;

  const name = profile.full_name ?? profile.business_name ?? "Vous";
  const planKey: PlanKey = (sub.plan as PlanKey) ?? "starter";
  const plan = PLANS[planKey];
  const expiresAt = new Date(sub.expires_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const subject = `Votre accès se termine le ${expiresAt}`;

  const [{ data: validatedCount }, { data: currentStage }] = await Promise.all([
    supabase
      .from("mission_submissions")
      .select("id", { count: "exact", head: true })
      .eq("statut", "valide")
      .filter("mission_progress.profile_id", "eq", profileId),
    supabase
      .from("mission_progress")
      .select("mission_id, status, missions(stage_id, stages(number))")
      .eq("profile_id", profileId)
      .in("status", ["a_faire", "en_cours", "soumis", "a_corriger"])
      .limit(1)
      .maybeSingle(),
  ]);

  const stageNum = ((currentStage as any)?.missions?.stages?.number) ?? "?";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:system-ui,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden;">
tr><td style="background:#1a1a2e;padding:32px 32px 24px;text-align:center;">
<h1 style="color:#f5c518;margin:0;font-size:22px;font-weight:700;">${subject}</h1>
</td></tr>
<tr><td style="padding:32px;">
<p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 16px;">Bonjour ${name},</p>
<p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 16px;">Votre accès ${plan.name} se termine le <strong>${expiresAt}</strong>.</p>
<p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 16px;">
  Votre progression : étape ${stageNum}, ${validatedCount ?? 0} mission(s) validée(s).
</p>
<p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 24px;">Renouvelez pour continuer sans interruption.</p>
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="${SITE_URL}/abonnement" style="background:#f5c518;color:#1a1a2e;padding:14px 32px;text-decoration:none;font-weight:700;font-size:15px;border-radius:4px;">Renouveler mon accès</a></td></tr></table>
</td></tr>
<tr><td style="background:#f0f0f0;padding:24px 32px;text-align:center;">
<p style="color:#666;font-size:13px;margin:0;">Virtuose Funnel</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = `Bonjour ${name},\n\nVotre accès ${plan.name} se termine le ${expiresAt}.\n\nVotre progression : étape ${stageNum}, ${validatedCount ?? 0} mission(s) validée(s).\n\nRenouvelez pour continuer sans interruption.\n\n${SITE_URL}/abonnement\n\nL'équipe Virtuose Funnel`;

  await sendEmail({ to: profile.email, type: "subscription_ending_soon", ref: `${profileId}_${sub.expires_at}`, subject, html, text });
}

export async function sendSubscriptionEndedEmail(profileId: string): Promise<void> {
  const supabase = createServiceClient();

  const [{ data: profile }] = await Promise.all([
    supabase.from("profiles").select("full_name, business_name, email").eq("id", profileId).maybeSingle(),
  ]);

  if (!profile || !profile.email) return;

  const name = profile.full_name ?? profile.business_name ?? "Vous";
  const subject = "Votre accès est en pause, votre progression est conservée";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:system-ui,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden;">
<tr><td style="background:#1a1a2e;padding:32px 32px 24px;text-align:center;">
<h1 style="color:#f5c518;margin:0;font-size:22px;font-weight:700;">Votre accès est en pause</h1>
</td></tr>
<tr><td style="padding:32px;">
<p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 16px;">Bonjour ${name},</p>
<p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 16px;">Votre abonnement a expiré, mais rien n'est perdu. Vos livrables et votre progression vous attendent.</p>
<p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 24px;">Réactivez votre accès pour reprendre là où vous en étiez.</p>
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="${SITE_URL}/abonnement" style="background:#f5c518;color:#1a1a2e;padding:14px 32px;text-decoration:none;font-weight:700;font-size:15px;border-radius:4px;">Réactiver mon accès</a></td></tr></table>
</td></tr>
<tr><td style="background:#f0f0f0;padding:24px 32px;text-align:center;">
<p style="color:#666;font-size:13px;margin:0;">Virtuose Funnel</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = `Bonjour ${name},\n\nVotre abonnement a expiré, mais rien n'est perdu. Vos livrables et votre progression vous attendent.\n\nRéactivez votre accès : ${SITE_URL}/abonnement\n\nL'équipe Virtuose Funnel`;

  await sendEmail({ to: profile.email, type: "subscription_ended", ref: `${profileId}_ended`, subject, html, text });
}
