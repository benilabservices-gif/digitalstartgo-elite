import { sendEmail, SITE_URL } from "../index";
import { PLANS, type PlanKey } from "@/lib/subscriptions/plans";
import { createServiceClient } from "@/lib/supabase/server";

export async function sendWelcomeEmail(profileId: string): Promise<void> {
  const supabase = createServiceClient();

  const [{ data: profile }, { data: sub }] = await Promise.all([
    supabase.from("profiles").select("full_name, business_name, email").eq("id", profileId).maybeSingle(),
    supabase
      .from("subscriptions")
      .select("plan")
      .eq("profile_id", profileId)
      .gt("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!profile) return;

  const name = profile.full_name ?? profile.business_name ?? "Vous";
  const planKey: PlanKey = (sub?.plan as PlanKey) ?? "starter";
  const delai = PLANS[planKey].delaiRetourHeures;
  const subject = `Bienvenue dans Virtuose Funnel, ${name}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:system-ui,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden;">
<tr><td style="background:#1a1a2e;padding:32px 32px 24px;text-align:center;">
<h1 style="color:#f5c518;margin:0;font-size:22px;font-weight:700;">Bienvenue dans Virtuose Funnel</h1>
</td></tr>
<tr><td style="padding:32px;">
<p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 16px;">Merci pour votre confiance. Votre parcours commence maintenant.</p>
<p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 16px;">Voici comment ça fonctionne :</p>
<ul style="color:#1a1a2e;font-size:15px;line-height:1.8;margin:0 0 24px;padding-left:20px;">
<li>8 étapes, des missions concrètes</li>
<li>Un coach relit chaque livrable et répond sous ${delai} heures</li>
<li>À votre rythme, sans pression</li>
</ul>
<p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 24px;">Votre première action : la mission 1.1, elle ne prend que 20 minutes.</p>
<table role="presentation" cellpadding="0" cellspacing="0">
<tr><td align="center">
<a href="${SITE_URL}/missions/1.1" style="background:#f5c518;color:#1a1a2e;padding:14px 32px;text-decoration:none;font-weight:700;font-size:15px;border-radius:4px;">Commencer mon état des lieux</a>
</td></tr>
</table>
</td></tr>
<tr><td style="background:#f0f0f0;padding:24px 32px;text-align:center;">
<p style="color:#666;font-size:13px;margin:0;">Virtuose Funnel — Votre tunnel de vente, construit pas à pas.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = `Bonjour ${name},\n\nMerci pour votre confiance. Votre parcours Virtuose Funnel commence maintenant.\n\nComment ça fonctionne :\n- 8 étapes, des missions concrètes\n- Un coach relit chaque livrable et répond sous ${delai} heures\n- À votre rythme, sans pression\n\nVotre première action : la mission 1.1, elle ne prend que 20 minutes.\n\nAccédez à votre mission : ${SITE_URL}/missions/1.1\n\nL'équipe Virtuose Funnel`;

  await sendEmail({ to: profile.email!, type: "welcome", ref: profileId, subject, html, text });
}
