import crypto from "node:crypto";

// Le lien de désinscription est signé : sans ce jeton, on ne peut pas
// désinscrire quelqu'un d'autre en changeant l'identifiant dans l'URL.
function secret(): string {
  const value = process.env.CRON_SECRET;
  if (!value) throw new Error("CRON_SECRET manquant : impossible de signer le lien de désinscription.");
  return value;
}

export function signUnsubscribeToken(profileId: string): string {
  return crypto.createHmac("sha256", secret()).update(`unsubscribe:${profileId}`).digest("hex");
}

export function verifyUnsubscribeToken(profileId: string, token: string | null): boolean {
  if (!token) return false;
  const expected = Buffer.from(signUnsubscribeToken(profileId));
  const provided = Buffer.from(token);
  return expected.length === provided.length && crypto.timingSafeEqual(expected, provided);
}
