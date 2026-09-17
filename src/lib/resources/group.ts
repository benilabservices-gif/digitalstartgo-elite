import type { ResourceGroup, ResourceRow, StageWithNumber } from "./types";

export function groupResourcesByStage(
  resources: ResourceRow[],
  stages: StageWithNumber[]
): ResourceGroup[] {
  const stageById = new Map(stages.map((stage) => [stage.id, stage]));
  const groups = new Map<string, ResourceGroup>();

  const generalGroup: ResourceGroup = {
    stageId: null,
    stageLabel: "Ressources générales",
    stageNumber: null,
    resources: [],
  };

  for (const resource of resources) {
    if (resource.stage_id === null) {
      generalGroup.resources.push(resource);
      continue;
    }

    const key = resource.stage_id;
    if (!groups.has(key)) {
      const stage = stageById.get(key);
      groups.set(key, {
        stageId: key,
        stageLabel: stage ? `${String(stage.number).padStart(2, "0")} ${stage.title}` : "Étape inconnue",
        stageNumber: stage?.number ?? null,
        resources: [],
      });
    }
    groups.get(key)!.resources.push(resource);
  }

  const sortByOrderIndex = (a: ResourceRow, b: ResourceRow) => a.order_index - b.order_index;
  generalGroup.resources.sort(sortByOrderIndex);
  for (const group of groups.values()) {
    group.resources.sort(sortByOrderIndex);
  }

  const orderedStageGroups = Array.from(groups.values()).sort(
    (a, b) => (a.stageNumber ?? 0) - (b.stageNumber ?? 0)
  );

  return generalGroup.resources.length > 0 ? [generalGroup, ...orderedStageGroups] : orderedStageGroups;
}
