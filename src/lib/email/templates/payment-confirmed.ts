import { sendEmail, SITE_URL } from "../index";
import { PLANS, formatXof, type PlanKey } from "@/lib/subscriptions/plans";
import { createServiceClient } from "@/lib/supabase/server";

export async function sendPaymentConfirmedEmail(profileId: string): Promise<void> {
  const supabase = createServiceClient();

  const [{ data: profile }, { data: sub }] = await Promise.all([
    supabase.from("profiles").select("full_name, business_name, email").eq("id", profileId).maybeSingle(),
    supabase
      .from("subscriptions")
      .select("plan, amount, expires_at")
      .eq("profile_id", profileId)
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!profile || !sub) return;

  const name = profile.full_name ?? profile.business_name ?? "Vous";
  const planKey: PlanKey = (sub.plan as PlanKey) ?? "starter";
  const plan = PLANS[planKey];
  const expiresAt = new Date(sub.expires_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const subject = `Paiement reçu : votre accès ${plan.name} est actif`;

  const avantagesList = plan.avantages.map((a) => `<li>${a}</li>`).join("");
  const eliteNote = planKey === "elite"
    ? `<p style="color:#1a1a2e;font-size:15px;line-height:1.6;margin:16px 0;padding:16px;background:#fff9e6;border-radius:4px;border-left:3px solid #f5c518;">Votre coach vous contacte sous 24 h pour planifier votre première séance individuelle.</p>`
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:system-ui,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0;">
tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden;">
<tr><td style="background:#1a1a2e;padding:32px 32px 24px;text-align:center;">
<h1 style="color:#f5c518;margin:0;font-size:22px;font-weight:700;">Paiement confirmé</h1>
</td></tr>
<tr><td style="padding:32px;">
<p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 8px;">Bonjour ${name},</p>
<p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 16px;">Votre paiement de <strong>${formatXof(sub.amount)}</strong> a bien été enregistré. Votre accès ${plan.name} est actif jusqu'au ${expiresAt}.</p>
<p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 16px;">Ce qui est inclus dans votre plan ${plan.name} :</p>
<ul style="color:#1a1a2e;font-size:15px;line-height:1.8;margin:0 0 16px;padding-left:20px;">${avantagesList}</ul>
${eliteNote}
<table role="presentation" cellpadding="0" cellspacing="0">
<tr><td align="center">
<a href="${SITE_URL}/dashboard" style="background:#f5c518;color:#1a1a2e;padding:14px 32px;text-decoration:none;font-weight:700;font-size:15px;border-radius:4px;">Accéder à mon parcours</a>
</td></tr>
</table>
<p style="color:#888;font-size:12px;line-height:1.5;margin:24px 0 0;">Cet email confirme votre paiement ; ce n'est pas une facture.</p>
</td></tr>
<tr><td style="background:#f0f0f0;padding:24px 32px;text-align:center;">
<p style="color:#666;font-size:13px;margin:0;">Virtuose Funnel</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = `Bonjour ${name},\n\nVotre paiement de ${formatXof(sub.amount)} a bien été enregistré. Votre accès ${plan.name} est actif jusqu'au ${expiresAt}.\n\nAvantages inclus :\n${plan.avantages.map((a) => `- ${a}`).join("\n")}\n${planKey === "elite" ? "\nVotre coach vous contacte sous 24 h pour planifier votre première séance individuelle." : ""}\n\nAccédez à votre parcours : ${SITE_URL}/dashboard\n\nCet email confirme votre paiement ; ce n'est pas une facture.\n\nL'équipe Virtuose Funnel`;

  await sendEmail({ to: profile.email!, type: "payment_confirmed", ref: profileId, subject, html, text });
}
