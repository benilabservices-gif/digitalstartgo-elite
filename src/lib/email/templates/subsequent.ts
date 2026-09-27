import { sendEmail, SITE_URL } from "../index";
import { getUserEmail } from "../recipients";
import { PLANS, formatXof, type PlanKey } from "@/lib/subscriptions/plans";
import { createServiceClient } from "@/lib/supabase/server";
import { signUnsubscribeToken } from "../unsubscribe-token";

export async function sendInactiveReminderEmail(profileId: string): Promise<void> {
  const supabase = createServiceClient();

  const [{ data: profile }, { data: activeSub }, { data: missions }, { data: progress }, { data: lastSub }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, business_name, rappels_email, created_at")
        .eq("id", profileId)
        .maybeSingle(),
      supabase
        .from("subscriptions")
        .select("plan, expires_at")
        .eq("profile_id", profileId)
        .gt("expires_at", new Date().toISOString())
        .order("expires_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("missions")
        .select("id, code, title, estimated_duration_minutes, ordre, stages(number, title)")
        .eq("active", true),
      supabase.from("mission_progress").select("mission_id, status, updated_at").eq("profile_id", profileId),
      supabase
        .from("mission_submissions")
        .select("created_at, mission_progress!inner(profile_id)")
        .eq("mission_progress.profile_id", profileId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  if (!profile || !activeSub || !profile.rappels_email) return;

  const progressRows = (progress ?? []) as Array<{ mission_id: string; status: string; updated_at: string | null }>;
  // Un livrable attend le coach : ce n'est pas au participant d'agir.
  if (progressRows.some((p) => p.status === "soumis")) return;

  // Inactif = aucune activité (soumission ou progression) depuis 5 jours.
  const activityDates = [
    lastSub?.created_at,
    ...progressRows.map((p) => p.updated_at),
    profile.created_at,
  ]
    .filter((d): d is string => typeof d === "string")
    .map((d) => new Date(d).getTime());
  const lastActivity = Math.max(...activityDates);
  if (Date.now() - lastActivity < 5 * 24 * 60 * 60 * 1000) return;

  // Prochaine mission : première mission active non validée, dans l'ordre du parcours.
  const statusByMission = new Map(progressRows.map((p) => [p.mission_id, p.status]));
  type MissionRow = {
    id: string;
    code: string;
    title: string;
    estimated_duration_minutes: number;
    ordre: number | null;
    stages: { number: number; title: string } | null;
  };
  const mission = ((missions ?? []) as unknown as MissionRow[])
    .sort((a, b) => (a.stages?.number ?? 0) - (b.stages?.number ?? 0) || (a.ordre ?? 0) - (b.ordre ?? 0))
    .find((m) => statusByMission.get(m.id) !== "valide");
  if (!mission) return;

  const email = await getUserEmail(profile.id);
  if (!email) return;

  const nextProg = { missions: mission };
  const name = profile.full_name ?? profile.business_name ?? "Vous";
  const duration = mission.estimated_duration_minutes ?? 20;
  const subject = `Votre prochaine mission ne prend que ${duration} minutes`;

  const unsubscribeLink = `${SITE_URL}/api/email/unsubscribe?profile=${profileId}&token=${signUnsubscribeToken(profileId)}`;

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
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="${SITE_URL}/missions/${mission.id}" style="background:#f5c518;color:#1a1a2e;padding:14px 32px;text-decoration:none;font-weight:700;font-size:15px;border-radius:4px;">Reprendre ma mission</a></td></tr></table>
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

  const text = `Bonjour ${name},\n\n${((nextProg as any).missions?.stages?.title ? `Vous êtes à l'étape ${((nextProg as any).missions?.stages?.number ?? "?")}.` : "Vous êtes en cours dans votre parcours.")}\n\nMission ${(nextProg as any).missions?.code ?? "?"} — ${(nextProg as any).missions?.title ?? "Votre prochaine mission"} (${duration} min).\n\nBloquez ${duration} minutes aujourd'hui, votre coach vous attend.\n\n${SITE_URL}/missions/${mission.id}\n\nNe plus recevoir ces rappels : ${unsubscribeLink}\n\nL'équipe Virtuose Funnel`;

  await sendEmail({ to: email, type: "inactive_reminder", ref: `${profileId}_semaine_${Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))}`, subject, html, text });
}

export async function sendSubscriptionEndingSoonEmail(profileId: string): Promise<void> {
  const supabase = createServiceClient();

  const [{ data: profile }, { data: sub }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, business_name").eq("id", profileId).maybeSingle(),
    supabase
      .from("subscriptions")
      .select("plan, expires_at, mode_paiement, echeance, engagement_fin")
      .eq("profile_id", profileId)
      .gt("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const email = profile ? await getUserEmail(profile.id) : null;
  if (!profile || !sub || !email) return;

  const name = profile.full_name ?? profile.business_name ?? "Vous";
  const planKey: PlanKey = (sub.plan as PlanKey) ?? "starter";
  const plan = PLANS[planKey];
  const expiresAt = new Date(sub.expires_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  // If monthly mode and engagement not finished, send monthly payment reminder
  if (sub.mode_paiement === "mensuel" && (sub.echeance ?? 1) < 3 && sub.engagement_fin && new Date(sub.engagement_fin) > new Date()) {
    const nextEcheance = (sub.echeance ?? 1) + 1;
    const subject = `Votre mensualité ${nextEcheance} sur 3 arrive le ${expiresAt}`;

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
  Votre mensualité ${nextEcheance} sur 3 arrive le <strong>${expiresAt}</strong>.
  Montant à régler : <strong>${formatXof(plan.amountXof)}</strong>.
</p>
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="${SITE_URL}/abonnement" style="background:#f5c518;color:#1a1a2e;padding:14px 32px;text-decoration:none;font-weight:700;font-size:15px;border-radius:4px;">Régler ma mensualité</a></td></tr></table>
</td></tr>
<tr><td style="background:#f0f0f0;padding:24px 32px;text-align:center;">
<p style="color:#666;font-size:13px;margin:0;">Virtuose Funnel</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

    const text = `Bonjour ${name},\n\nVotre mensualité ${nextEcheance} sur 3 arrive le ${expiresAt}.\nMontant à régler : ${formatXof(plan.amountXof)}.\n\nRégler ma mensualité : ${SITE_URL}/abonnement\n\nL'équipe Virtuose Funnel`;

    await sendEmail({ to: email, type: "subscription_ending_soon", ref: `${profileId}_${sub.expires_at}`, subject, html, text });
    return;
  }

  // Original renewal email for one-time payment or when engagement is ending
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
  const subject = `Votre accès se termine le ${expiresAt}`;

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

  await sendEmail({ to: email, type: "subscription_ending_soon", ref: `${profileId}_${sub.expires_at}`, subject, html, text });
}

export async function sendSubscriptionEndedEmail(profileId: string): Promise<void> {
  const supabase = createServiceClient();

  const [{ data: profile }, { data: lastSub }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, business_name").eq("id", profileId).maybeSingle(),
    supabase
      .from("subscriptions")
      .select("expires_at")
      .eq("profile_id", profileId)
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  // Déjà renouvelé : son dernier abonnement court encore, pas d'email « en pause ».
  if (!profile || !lastSub || new Date(lastSub.expires_at).getTime() > Date.now()) return;

  const email = await getUserEmail(profile.id);
  if (!email) return;

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

  await sendEmail({ to: email, type: "subscription_ended", ref: `${profileId}_${lastSub.expires_at}`, subject, html, text });
}

/**
 * E10 — Mensualité en retard (cron quotidien)
 * Abonnement expiré depuis 1 jour, engagement pas terminé, aucun abonnement actif
 */
export async function sendLatePaymentReminderEmail(profileId: string): Promise<void> {
  const supabase = createServiceClient();
  const now = new Date();

  const [{ data: profile }, { data: lastSub }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, business_name").eq("id", profileId).maybeSingle(),
    supabase
      .from("subscriptions")
      .select("expires_at, engagement_fin, mode_paiement, echeance, plan")
      .eq("profile_id", profileId)
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!profile || !lastSub) return;

  // Skip if no active engagement or not monthly mode
  if (lastSub.mode_paiement !== "mensuel" || !lastSub.engagement_fin) return;
  // Engagement déjà terminé : ce n'est plus une mensualité en retard (E9 s'en charge).
  if (new Date(lastSub.engagement_fin) <= now) return;

  // Skip if expires_at is not overdue by at least 1 day
  if (new Date(lastSub.expires_at).getTime() > now.getTime() - 24 * 60 * 60 * 1000) return;

  // Skip if there's an active subscription (already renewed)
  const { data: activeSub } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("profile_id", profileId)
    .gt("expires_at", now.toISOString())
    .limit(1)
    .maybeSingle();
  if (activeSub) return;

  const email = await getUserEmail(profile.id);
  if (!email) return;

  const name = profile.full_name ?? profile.business_name ?? "Vous";
  const planKey: PlanKey = (lastSub.plan as PlanKey) ?? "starter";
  const plan = PLANS[planKey];
  const subject = `Votre mensualité est en retard : votre accès est en pause`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:system-ui,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden;">
<tr><td style="background:#1a1a2e;padding:32px 32px 24px;text-align:center;">
<h1 style="color:#f5c518;margin:0;font-size:22px;font-weight:700;">Votre mensualité est en retard</h1>
</td></tr>
<tr><td style="padding:32px;">
<p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 16px;">Bonjour ${name},</p>
<p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 16px;">
  Votre mensualité n'a pas été réglée. Votre accès est actuellement en pause.
  Montant à régler : <strong>${formatXof(plan.amountXof)}</strong>.
</p>
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="${SITE_URL}/abonnement" style="background:#f5c518;color:#1a1a2e;padding:14px 32px;text-decoration:none;font-weight:700;font-size:15px;border-radius:4px;">Régler ma mensualité</a></td></tr></table>
</td></tr>
<tr><td style="background:#f0f0f0;padding:24px 32px;text-align:center;">
<p style="color:#666;font-size:13px;margin:0;">Virtuose Funnel</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = `Bonjour ${name},\n\nVotre mensualité est en retard : votre accès est en pause.\nMontant à régler : ${formatXof(plan.amountXof)}.\n\nRégler ma mensualité : ${SITE_URL}/abonnement\n\nL'équipe Virtuose Funnel`;

  await sendEmail({ to: email, type: "late_payment_reminder", ref: `${profileId}_${lastSub.expires_at}`, subject, html, text });
}
