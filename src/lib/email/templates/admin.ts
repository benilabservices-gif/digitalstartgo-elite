import { sendEmail, SITE_URL } from "../index";
import { PLANS, formatXof, type PlanKey } from "@/lib/subscriptions/plans";
import { createServiceClient } from "@/lib/supabase/server";

export async function sendNewSaleEmail(profileId: string): Promise<void> {
  const supabase = createServiceClient();

  const [{ data: profile }, { data: sub }] = await Promise.all([
    supabase.from("profiles").select("full_name, business_name").eq("id", profileId).maybeSingle(),
    supabase
      .from("subscriptions")
      .select("plan, amount, currency, expires_at")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!profile || !sub) return;

  const participantName = profile.business_name ?? profile.full_name ?? profileId;
  const planKey: PlanKey = (sub.plan as PlanKey) ?? "starter";
  const subject = `Nouvelle vente : ${planKey}, ${formatXof(sub.amount)} FCFA`;
  const expiresAt = new Date(sub.expires_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const findAdmins = async (): Promise<string[]> => {
    const { data: admins } = await supabase.from("profiles").select("email").eq("role", "admin");
    return (admins ?? []).map((a: any) => a.email).filter(Boolean);
  };

  const recipients = await findAdmins();
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
<table style="width:100%;border-collapse:collapse;margin:16px 0;">
<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;"><strong style="color:#666;font-size:13px;">Participant</strong></td><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#1a1a2e;font-size:15px;">${participantName}</td></tr>
<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;"><strong style="color:#666;font-size:13px;">Plan</strong></td><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#1a1a2e;font-size:15px;">${planKey}</td></tr>
<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;"><strong style="color:#666;font-size:13px;">Montant</strong></td><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#1a1a2e;font-size:15px;">${formatXof(sub.amount)}</td></tr>
<tr><td style="padding:8px 12px;"><strong style="color:#666;font-size:13px;">Date de fin d'accès</strong></td><td style="padding:8px 12px;color:#1a1a2e;font-size:15px;">${expiresAt}</td></tr>
</table>
<table role="presentation" cellpadding="0" cellspacing="0">
<tr><td align="center">
<a href="${SITE_URL}/admin/abonnements" style="background:#f5c518;color:#1a1a2e;padding:14px 32px;text-decoration:none;font-weight:700;font-size:15px;border-radius:4px;">Voir les abonnements</a>
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

  const text = `${subject}\n\nParticipant : ${participantName}\nPlan : ${planKey}\nMontant : ${formatXof(sub.amount)}\nDate de fin d'accès : ${expiresAt}\n\n${SITE_URL}/admin/abonnements`;

  for (const to of recipients) {
    await sendEmail({ to, type: "new_sale", ref: `${profileId}_${sub.plan}_${sub.amount}`, subject, html, text });
  }
}
