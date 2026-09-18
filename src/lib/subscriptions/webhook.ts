import crypto from "node:crypto";

// Rejette tout ce qui dépasse 300 secondes : une signature volée et
// rejouée plus tard ne doit plus être acceptée.
const MAX_SIGNATURE_AGE_SECONDS = 300;

export function verifyCartfloxSignature(
  rawBody: string,
  timestampHeader: string | null,
  signatureHeader: string | null,
  secret: string,
  now: number = Date.now()
): boolean {
  if (!timestampHeader || !signatureHeader) {
    return false;
  }

  const age = Math.abs(now / 1000 - Number(timestampHeader));
  if (!Number.isFinite(age) || age > MAX_SIGNATURE_AGE_SECONDS) {
    return false;
  }

  const providedSignature = signatureHeader
    .split(",")
    .find((part) => part.startsWith("v1="))
    ?.slice(3);
  if (!providedSignature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${timestampHeader}.${rawBody}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature);
  const providedBuffer = Buffer.from(providedSignature);

  return (
    expectedBuffer.length === providedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, providedBuffer)
  );
}
