import { describe, it, expect } from "vitest";
import { deriveCohortStatus } from "./status";

describe("deriveCohortStatus", () => {
  it("renvoie « a_venir » avant la date de début", () => {
    const today = new Date("2026-09-01T00:00:00Z");
    expect(deriveCohortStatus("2026-10-01", "2026-11-26", today)).toBe("a_venir");
  });

  it("renvoie « en_cours » entre le début et la fin", () => {
    const today = new Date("2026-10-15T00:00:00Z");
    expect(deriveCohortStatus("2026-10-01", "2026-11-26", today)).toBe("en_cours");
  });

  it("renvoie « terminee » après la date de fin", () => {
    const today = new Date("2026-12-01T00:00:00Z");
    expect(deriveCohortStatus("2026-10-01", "2026-11-26", today)).toBe("terminee");
  });

  it("considère le jour de début comme « en_cours »", () => {
    const today = new Date("2026-10-01T00:00:00Z");
    expect(deriveCohortStatus("2026-10-01", "2026-11-26", today)).toBe("en_cours");
  });
});
