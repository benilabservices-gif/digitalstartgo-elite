import { describe, expect, it } from "vitest";
import { peutTelechargerRessource } from "./access";

const maintenant = new Date("2026-09-27T12:00:00Z");

describe("accès aux fichiers de la bibliothèque", () => {
  it("autorise un participant dont l'abonnement court encore", () => {
    expect(peutTelechargerRessource("participant", "2026-10-27T00:00:00Z", maintenant)).toBe(true);
  });

  it("refuse un participant dont l'abonnement a expiré", () => {
    expect(peutTelechargerRessource("participant", "2026-09-26T00:00:00Z", maintenant)).toBe(false);
  });

  it("refuse un participant sans abonnement", () => {
    expect(peutTelechargerRessource("participant", null, maintenant)).toBe(false);
  });

  it("autorise toujours les coachs et les admins", () => {
    expect(peutTelechargerRessource("coach", null, maintenant)).toBe(true);
    expect(peutTelechargerRessource("admin", null, maintenant)).toBe(true);
  });
});
