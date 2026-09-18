import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { verifyCartfloxSignature } from "./webhook";

const SECRET = "test_secret";

function sign(body: string, timestampSeconds: number, secret = SECRET) {
  const hex = crypto.createHmac("sha256", secret).update(`${timestampSeconds}.${body}`).digest("hex");
  return { timestamp: String(timestampSeconds), signature: `t=${timestampSeconds},v1=${hex}` };
}

describe("verifyCartfloxSignature", () => {
  it("accepte une signature valide et récente", () => {
    const now = Date.now();
    const { timestamp, signature } = sign("{}", Math.floor(now / 1000));
    expect(verifyCartfloxSignature("{}", timestamp, signature, SECRET, now)).toBe(true);
  });

  it("refuse une signature générée avec un autre secret", () => {
    const now = Date.now();
    const { timestamp, signature } = sign("{}", Math.floor(now / 1000), "autre_secret");
    expect(verifyCartfloxSignature("{}", timestamp, signature, SECRET, now)).toBe(false);
  });

  it("refuse un timestamp de plus de 300 secondes (rejeu)", () => {
    const now = Date.now();
    const oldTimestamp = Math.floor(now / 1000) - 400;
    const { timestamp, signature } = sign("{}", oldTimestamp);
    expect(verifyCartfloxSignature("{}", timestamp, signature, SECRET, now)).toBe(false);
  });

  it("refuse quand les en-têtes sont absents", () => {
    expect(verifyCartfloxSignature("{}", null, null, SECRET)).toBe(false);
  });

  it("refuse un corps modifié après signature", () => {
    const now = Date.now();
    const { timestamp, signature } = sign("{}", Math.floor(now / 1000));
    expect(verifyCartfloxSignature('{"amount":1}', timestamp, signature, SECRET, now)).toBe(false);
  });
});
