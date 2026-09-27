import { createServiceClient } from "@/lib/supabase/server";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe-token";

function page(titre: string, message: string, status = 200) {
  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${titre}</title></head>
<body style="margin:0;background:#EDEFF4;font-family:system-ui,sans-serif;color:#0A1531;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:16px;">
<div style="max-width:440px;background:#fff;padding:32px;border-radius:4px;text-align:center;">
<h1 style="font-size:20px;margin:0 0 12px;">${titre}</h1><p style="line-height:1.6;margin:0 0 24px;">${message}</p>
<a href="https://www.virtuosefunnel.online/dashboard" style="background:#F0B928;color:#0A1531;padding:12px 24px;text-decoration:none;font-weight:700;border-radius:3px;">Retour à mon parcours</a>
</div></body></html>`;
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

// Lien « Ne plus recevoir ces rappels » des emails de relance.
// Signé : le jeton empêche de désinscrire quelqu'un d'autre en changeant l'identifiant.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get("profile");
  const token = searchParams.get("token");

  if (!profileId || !verifyUnsubscribeToken(profileId, token)) {
    return page("Lien invalide", "Ce lien de désinscription n'est pas valide.", 400);
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("profiles").update({ rappels_email: false }).eq("id", profileId);

  if (error) {
    console.error("[email/unsubscribe] erreur :", error.message);
    return page("Une erreur est survenue", "Réessayez dans quelques minutes.", 500);
  }

  return page(
    "C'est noté",
    "Vous ne recevrez plus les rappels de mission. Les emails liés à vos livrables et à votre abonnement continueront d'arriver."
  );
}
