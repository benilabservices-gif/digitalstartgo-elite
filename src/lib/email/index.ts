import type { EmailOptions } from "./types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.virtuosefunnel.online";
const FROM = "Virtuose Funnel <contact@virtuosefunnel.online>";

async function getResend() {
  const { Resend } = await import("resend");
  return new Resend(process.env.RESEND_API_KEY!);
}

/**
 * Envoie un email une seule fois par (type, ref).
 * La ligne email_log est réservée avant l'envoi (la contrainte unique bloque les
 * doublons, ex. webhook reçu deux fois) ; si l'envoi échoue, la ligne est
 * supprimée pour qu'un prochain déclenchement puisse retenter.
 * Ne lève jamais d'erreur : un email raté ne doit pas faire échouer l'action métier.
 */
export async function sendEmail({ to, type, ref, subject, html, text }: EmailOptions): Promise<void> {
  const destinataires = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (destinataires.length === 0) return;

  const { createServiceClient } = await import("@/lib/supabase/server");
  const supabase = createServiceClient();

  const { error: logError } = await supabase.from("email_log").insert({ type, ref });
  if (logError) {
    if (logError.code !== "23505") console.error(`[email] ${type} : journal indisponible (${logError.message})`);
    return;
  }

  try {
    const resend = await getResend();
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: destinataires,
      subject,
      html,
      text,
      ...(process.env.REPLY_TO_EMAIL ? { replyTo: process.env.REPLY_TO_EMAIL } : {}),
    });
    if (error) throw new Error(error.message);
    await supabase.from("email_log").update({ resend_id: data?.id ?? null }).eq("type", type).eq("ref", ref);
  } catch (err) {
    console.error(`[email] ${type} : envoi échoué (${err instanceof Error ? err.message : "erreur inconnue"})`);
    await supabase.from("email_log").delete().eq("type", type).eq("ref", ref);
  }
}

export { SITE_URL };
export type { EmailOptions };

export { sendWelcomeEmail } from "./templates/welcome";
export { sendPaymentConfirmedEmail } from "./templates/payment-confirmed";
export { sendSubmissionReceivedEmail, sendCoachNotificationEmail } from "./templates/submission";
export { sendMissionValidatedEmail, sendCorrectionRequestedEmail } from "./templates/validation";
export { sendInactiveReminderEmail, sendSubscriptionEndingSoonEmail, sendSubscriptionEndedEmail } from "./templates/subsequent";
export { sendNewSaleEmail } from "./templates/admin";
export { sendLateSubmissionsEmail } from "./templates/cron";
