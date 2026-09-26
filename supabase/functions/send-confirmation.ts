import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const resendApiKey = process.env.RESEND_API_KEY!;

export default async function handler(req: Request) {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const { userId, email, token } = await req.json();

  if (!userId || !email || !token) {
    return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Virtuose Funnel <onboarding@resend.dev>",
        to: [email],
        subject: "Confirme ton compte Virtuose Funnel",
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;">
            <h2 style="color:#1a1a2e;">Bienvenue sur Virtuose Funnel !</h2>
            <p>Confirme ton adresse email pour accéder à ton espace de travail.</p>
            <a href="${supabaseUrl}/auth/confirm?token=${token}&type=email"
               style="display:inline-block;padding:12px 24px;background:#F0B928;color:#000;text-decoration:none;border-radius:4px;font-weight:600;">
              Confirmer mon email
            </a>
            <p style="margin-top:24px;font-size:12px;color:#888;">
              Si tu n'as pas créé de compte, ignore cet email.
            </p>
          </div>
        `,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(data));

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error("Resend error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
