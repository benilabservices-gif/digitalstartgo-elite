import { sendEmail, SITE_URL } from "../index";
import { getUserEmail } from "../recipients";
import { PLANS, type PlanKey } from "@/lib/subscriptions/plans";
import { createServiceClient } from "@/lib/supabase/server";

export async function sendMissionValidatedEmail(submissionId: string): Promise<void> {
  const supabase = createServiceClient();

  const { data: sub } = await supabase
    .from("mission_submissions")
    .select("feedback_coach, mission_progress_id")
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
    .select("code, title, estimated_duration_minutes, stage_id, ordre")
    .eq("id", missionProg.mission_id)
    .maybeSingle();

  if (!mission) return;

  const { data: stage } = await supabase
    .from("stages")
    .select("number, title, objective, slug")
    .eq("id", mission.stage_id)
    .maybeSingle();

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
  const feedback = sub.feedback_coach ?? "";
  let subject = `Mission ${mission.code} validée ✔`;

  const fetchNextMission = async (): Promise<{ id: string; code: string; title: string; estimated_duration_minutes: number } | null> => {
    const { data: next } = await supabase
      .from("missions")
      .select("id, code, title, estimated_duration_minutes")
      .eq("stage_id", mission.stage_id)
      .gt("ordre", mission.ordre ?? 0)
      .eq("active", true)
      .order("ordre", { ascending: true })
      .limit(1)
      .maybeSingle();
    return next;
  };

  const nextMission = await fetchNextMission();
  const isLastMissionOfStage = !nextMission;

  const fetchValidatedMissions = async (): Promise<Array<{ code: string; title: string }>> => {
    const { data: validatedSubs } = await supabase
      .from("mission_submissions")
      .select("mission_progress_id")
      .eq("statut", "valide")
      .filter("mission_progress.profile_id", "eq", missionProg.profile_id);
    const progressIds = [...new Set((validatedSubs ?? []).map((v: any) => v.mission_progress_id))];
    if (progressIds.length === 0) return [];
    const { data: progs } = await supabase
      .from("mission_progress")
      .select("mission_id")
      .in("id", progressIds);
    const missionIds = (progs ?? []).map((p: any) => p.mission_id);
    const { data: missions } = await supabase
      .from("missions")
      .select("code, title")
      .in("id", missionIds);
    return (missions ?? []) as Array<{ code: string; title: string }>;
  };

  const validatedMissions = isLastMissionOfStage ? await fetchValidatedMissions() : [];

  const stageNumber = stage?.number;
  const nextStageNumber = stageNumber ? stageNumber + 1 : null;
  const { data: nextStage } = nextStageNumber
    ? await supabase.from("stages").select("number, title, objective, slug").eq("number", nextStageNumber).maybeSingle()
    : { data: null };

  const isLastStage = !nextStage;

  let bodyHtml = "";
  let bodyText = "";

  if (isLastStage) {
    bodyHtml = `
<p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 16px;">Félicitations ${name} ! Vous avez terminé le parcours Virtuose Funnel.</p>
<p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 16px;">Vous avez construit les fondations de votre tunnel de vente étape par étape. Votre coach a validé chacune de vos missions.</p>
<p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 24px;">Si vous souhaitez partager votre témoignage, répondez simplement à cet email.</p>
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="${SITE_URL}/dashboard" style="background:#f5c518;color:#1a1a2e;padding:14px 32px;text-decoration:none;font-weight:700;font-size:15px;border-radius:4px;">Voir mon bilan</a></td></tr></table>`;
    bodyText = `Félicitations ${name} ! Vous avez terminé le parcours Virtuose Funnel.\n\nSi vous souhaitez partager votre témoignage, répondez à cet email.\n\n${SITE_URL}/dashboard`;
    subject = "Vous avez terminé le parcours Virtuose Funnel";
  } else if (isLastMissionOfStage) {
    bodyHtml = `
<p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 16px;">Félicitations ${name} ! L'étape ${stageNumber} est terminée : « ${nextStage?.title ?? `l'étape ${nextStageNumber}`} » est débloquée.</p>
<p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 16px;">Ce que vous avez construit dans cette étape :</p>
<ul style="color:#1a1a2e;font-size:15px;line-height:1.8;margin:0 0 16px;padding-left:20px;">
${validatedMissions.map((m) => `<li>${m.code} — ${m.title}</li>`).join("")}
</ul>
<p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 16px;"><strong>Retour de votre coach sur la dernière mission :</strong></p>
<blockquote style="border-left:3px solid #f5c518;padding-left:16px;color:#444;font-size:15px;line-height:1.6;margin:0 0 24px;">${feedback.replace(/\n/g, "<br>")}</blockquote>
<p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 24px;">Ce qui vous attend à l'étape suivante : ${nextStage?.objective ?? "De nouvelles étapes vous attendent."}</p>
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="${SITE_URL}/parcours/${nextStage?.slug ?? `etape-${nextStageNumber}`}" style="background:#f5c518;color:#1a1a2e;padding:14px 32px;text-decoration:none;font-weight:700;font-size:15px;border-radius:4px;">Découvrir l'étape ${nextStageNumber}</a></td></tr></table>`;
    bodyText = `Félicitations ${name} ! L'étape ${stageNumber} est terminée : "${nextStage?.title}" est débloquée.\n\nMissions validées :\n${validatedMissions.map((m) => `- ${m.code} — ${m.title}`).join("\n")}\n\nRetour de votre coach :\n${feedback}\n\n${SITE_URL}/parcours/${nextStage?.slug ?? `etape-${nextStageNumber}}`}`;
  } else {
    bodyHtml = `
<p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 16px;">Bonne nouvelle, ${name} ! La mission ${mission.code} est validée.</p>
<p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 16px;"><strong>Le retour de votre coach :</strong></p>
<blockquote style="border-left:3px solid #f5c518;padding-left:16px;color:#444;font-size:15px;line-height:1.6;margin:0 0 16px;">${feedback.replace(/\n/g, "<br>")}</blockquote>
${nextMission ? `<p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 24px;">Prochaine mission : <strong>${nextMission.code}</strong> — ${nextMission.title} (${nextMission.estimated_duration_minutes} min).</p>
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="${SITE_URL}/missions/${nextMission.id}" style="background:#f5c518;color:#1a1a2e;padding:14px 32px;text-decoration:none;font-weight:700;font-size:15px;border-radius:4px;">Passer à la mission ${nextMission.code}</a></td></tr></table>` : ""}`;
    bodyText = `Bonne nouvelle, ${name} ! La mission ${mission.code} est validée.\n\nRetour de votre coach :\n${feedback}\n\n${nextMission ? `Prochaine mission : ${nextMission.code} — ${nextMission.title} (${nextMission.estimated_duration_minutes} min).\n${SITE_URL}/missions/${nextMission.id}` : ""}`;
  }

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
${bodyHtml}
</td></tr>
<tr><td style="background:#f0f0f0;padding:24px 32px;text-align:center;">
<p style="color:#666;font-size:13px;margin:0;">Virtuose Funnel</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  await sendEmail({ to: email, type: "mission_validated", ref: submissionId, subject, html, text: bodyText });
}

export async function sendCorrectionRequestedEmail(submissionId: string): Promise<void> {
  const supabase = createServiceClient();

  const { data: sub } = await supabase
    .from("mission_submissions")
    .select("feedback_coach, mission_progress_id")
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
    .select("id, code, title")
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

  const name = profile.full_name ?? profile.business_name ?? "Vous";
  const feedback = sub.feedback_coach ?? "";
  const subject = `Votre coach vous a répondu : mission ${mission.code}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:system-ui,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden;">
<tr><td style="background:#1a1a2e;padding:32px 32px 24px;text-align:center;">
<h1 style="color:#f5c518;margin:0;font-size:22px;font-weight:700;">Mission ${mission.code}</h1>
</td></tr>
<tr><td style="padding:32px;">
<p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 16px;">Bonjour ${name},</p>
<p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 16px;">C'est tout à fait normal — c'est comme ça qu'on progresse. Votre coach a un retour pour vous :</p>
<blockquote style="border-left:3px solid #f5c518;padding-left:16px;color:#444;font-size:15px;line-height:1.6;margin:0 0 24px;">${feedback.replace(/\n/g, "<br>")}</blockquote>
<p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 24px;">Votre réponse précédente est déjà pré-remplie, il suffit de l'ajuster.</p>
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="${SITE_URL}/missions/${mission.id}" style="background:#f5c518;color:#1a1a2e;padding:14px 32px;text-decoration:none;font-weight:700;font-size:15px;border-radius:4px;">Corriger ma mission</a></td></tr></table>
</td></tr>
<tr><td style="background:#f0f0f0;padding:24px 32px;text-align:center;">
<p style="color:#666;font-size:13px;margin:0;">Virtuose Funnel</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = `Bonjour ${name},\n\nC'est tout à fait normal — c'est comme ça qu'on progresse.\n\nRetour de votre coach :\n${feedback}\n\nVotre réponse précédente est déjà pré-remplie, il suffit de l'ajuster.\n\n${SITE_URL}/missions/${mission.id}\n\nL'équipe Virtuose Funnel`;

  await sendEmail({ to: email, type: "correction_requested", ref: submissionId, subject, html, text });
}
