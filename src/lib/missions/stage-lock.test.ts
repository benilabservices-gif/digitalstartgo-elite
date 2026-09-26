import { describe, it, expect } from "vitest";
import { isStageValidated, getNextMissionId } from "./stage-lock";

describe("isStageValidated", () => {
  it("retourne true quand toutes les missions actives sont validées", () => {
    const missions = [
      { id: "m1", active: true },
      { id: "m2", active: true },
    ];
    const progress = new Map([["m1", "valide"], ["m2", "valide"]]);
    expect(isStageValidated(missions, progress)).toBe(true);
  });

  it("retourne false quand une mission active n'est pas validée", () => {
    const missions = [
      { id: "m1", active: true },
      { id: "m2", active: true },
    ];
    const progress = new Map([["m1", "valide"], ["m2", "soumis"]]);
    expect(isStageValidated(missions, progress)).toBe(false);
  });

  it("retourne true si une mission inactive est validée (cas nexora)", () => {
    // Nexora a validé l'ancienne mission de l'étape 1 (inactive)
    // Donc l'étape 2 doit rester ouverte
    const missions = [
      { id: "old-mission", active: false },
      { id: "new-mission", active: true },
    ];
    const progress = new Map([["old-mission", "valide"]]);
    expect(isStageValidated(missions, progress)).toBe(true);
  });

  it("retourne false pour un participant qui n'a rien fait", () => {
    const missions = [
      { id: "m1", active: true },
    ];
    const progress = new Map<string, string>();
    expect(isStageValidated(missions, progress)).toBe(false);
  });

  it("retourne true s'il n'y a pas de missions", () => {
    expect(isStageValidated([], new Map())).toBe(true);
  });
});

describe("getNextMissionId", () => {
  it("retourne la première mission active non validée", () => {
    const missions = [
      { id: "m1", active: true, ordre: 1 },
      { id: "m2", active: true, ordre: 2 },
      { id: "m3", active: true, ordre: 3 },
    ];
    const progress = new Map([["m1", "valide"]]);
    expect(getNextMissionId(missions, progress)).toBe("m2");
  });

  it("retourne null si toutes les missions actives sont validées", () => {
    const missions = [
      { id: "m1", active: true, ordre: 1 },
      { id: "m2", active: true, ordre: 2 },
    ];
    const progress = new Map([["m1", "valide"], ["m2", "valide"]]);
    expect(getNextMissionId(missions, progress)).toBeNull();
  });

  it("ignore les missions inactives pour la détermination de la prochaine mission", () => {
    const missions = [
      { id: "old", active: false, ordre: 0 },
      { id: "m1", active: true, ordre: 1 },
    ];
    const progress = new Map();
    expect(getNextMissionId(missions, progress)).toBe("m1");
  });
});
