import type { EmailOptions } from "./types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.virtuosefunnel.online";
const FROM = "Virtuose Funnel <contact@virtuosefunnel.online>";

async function getResend() {
  const { Resend } = await import("resend");
  return new Resend(process.env.RESEND_API_KEY!);
}

export async function sendEmail({ to, type, ref, subject, html, text }: EmailOptions): Promise<void> {
  const resend = await getResend();

  const payload: Parameters<typeof resend.emails.send>[0] = {
    from: FROM,
    to,
    subject,
    html,
    text,
  };
  if (process.env.REPLY_TO_EMAIL) {
    (payload as any).reply_to = process.env.REPLY_TO_EMAIL;
  }

  const { createServiceClient } = await import("@/lib/supabase/server");
  const supabase = createServiceClient();

  try {
    const { error: logError } = await supabase.from("email_log").insert({ type, ref, profile_id: null });
    if (logError) {
      if (logError.code === "23505") return;
      console.error("[email] log insert error:", logError.message);
      return;
    }
  } catch (err: any) {
    console.error("[email] log error:", err?.message);
    return;
  }

  try {
    const { data, error } = await resend.emails.send(payload);
    if (error) {
      console.error("[email] send error:", error.message);
      return;
    }
    await supabase
      .from("email_log")
      .update({ resend_id: data?.id })
      .eq("type", type)
      .eq("ref", ref)
      .eq("resend_id", null);
  } catch (err: any) {
    console.error("[email] exception:", err?.message);
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
