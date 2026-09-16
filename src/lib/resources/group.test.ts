import { describe, it, expect } from "vitest";
import { groupResourcesByStage } from "./group";
import type { ResourceRow, StageWithNumber } from "./types";

const stages: StageWithNumber[] = [
  { id: "stage-2", number: 2, title: "Offre" },
  { id: "stage-1", number: 1, title: "Diagnostic" },
];

function makeResource(overrides: Partial<ResourceRow>): ResourceRow {
  return {
    id: "id",
    stage_id: null,
    slug: "slug",
    title: "Titre",
    description: "Description",
    type: "guide",
    content_blocks: [],
    external_url: null,
    order_index: 0,
    ...overrides,
  };
}

describe("groupResourcesByStage", () => {
  it("trie les groupes par numéro d'étape croissant, pas par ordre d'insertion", () => {
    const resources = [
      makeResource({ id: "r-offre", stage_id: "stage-2", order_index: 1 }),
      makeResource({ id: "r-diagnostic", stage_id: "stage-1", order_index: 1 }),
    ];

    const groups = groupResourcesByStage(resources, stages);

    expect(groups.map((g) => g.stageNumber)).toEqual([1, 2]);
  });

  it("place les ressources sans étape dans un groupe « Ressources générales » en tête", () => {
    const resources = [
      makeResource({ id: "r-generale", stage_id: null, order_index: 1 }),
      makeResource({ id: "r-diagnostic", stage_id: "stage-1", order_index: 1 }),
    ];

    const groups = groupResourcesByStage(resources, stages);

    expect(groups[0].stageLabel).toBe("Ressources générales");
    expect(groups[0].resources.map((r) => r.id)).toEqual(["r-generale"]);
  });

  it("omet le groupe général quand il n'y a aucune ressource sans étape", () => {
    const resources = [makeResource({ id: "r-diagnostic", stage_id: "stage-1" })];

    const groups = groupResourcesByStage(resources, stages);

    expect(groups.some((g) => g.stageId === null)).toBe(false);
  });

  it("trie les ressources d'un même groupe par order_index", () => {
    const resources = [
      makeResource({ id: "second", stage_id: "stage-1", order_index: 2 }),
      makeResource({ id: "first", stage_id: "stage-1", order_index: 1 }),
    ];

    const groups = groupResourcesByStage(resources, stages);

    expect(groups[0].resources.map((r) => r.id)).toEqual(["first", "second"]);
  });
});
