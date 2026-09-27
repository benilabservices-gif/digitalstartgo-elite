import { beforeEach, describe, expect, it } from "vitest";
import { signUnsubscribeToken, verifyUnsubscribeToken } from "./unsubscribe-token";

describe("jeton de désinscription des rappels", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "secret-de-test";
  });

  it("accepte le jeton signé pour le bon profil", () => {
    const token = signUnsubscribeToken("profil-a");
    expect(verifyUnsubscribeToken("profil-a", token)).toBe(true);
  });

  it("refuse le jeton d'un profil pour en désinscrire un autre", () => {
    const token = signUnsubscribeToken("profil-a");
    expect(verifyUnsubscribeToken("profil-b", token)).toBe(false);
  });

  it("refuse un lien sans jeton ou avec un jeton inventé", () => {
    expect(verifyUnsubscribeToken("profil-a", null)).toBe(false);
    expect(verifyUnsubscribeToken("profil-a", "abc")).toBe(false);
  });
});
