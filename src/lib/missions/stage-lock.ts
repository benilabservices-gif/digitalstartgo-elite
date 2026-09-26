type MissionProgressRow = {
  mission_id: string;
  status: string | null;
};

/**
 * Vérifie si une étape est validée pour un participant donné.
 * Une étape est validée si :
 * - Toutes ses missions actives (active=true) sont validées, OU
 * - Au moins une de ses missions inactives (active=false) est validée.
 *
 * Cette règle permet de ne pas re-verrouiller les participants existants
 * qui ont validé d'anciennes missions.
 */
export function isStageValidated(
  missions: Array<{ id: string; active: boolean }>,
  progressByMission: Map<string, string>
): boolean {
  if (missions.length === 0) return true;

  const activeMissions = missions.filter((m) => m.active !== false);
  const inactiveMissions = missions.filter((m) => m.active === false);

  const activeAllValidated =
    activeMissions.length === 0 ||
    activeMissions.every((m) => progressByMission.get(m.id) === "valide");

  const hasInactiveValidated =
    inactiveMissions.length > 0 &&
    inactiveMissions.some((m) => progressByMission.get(m.id) === "valide");

  return activeAllValidated || hasInactiveValidated;
}

/**
 * Détermine si une étape est actuellement en cours (non verrouillée).
 * Une étape est bloquée si toutes les missions actives suivantes ne sont pas validées
 * et qu'aucune mission inactive précédente n'a été validée.
 */
export function isStageLocked(
  missions: Array<{ id: string; active: boolean }>,
  progressByMission: Map<string, string>
): boolean {
  return !isStageValidated(missions, progressByMission);
}

/**
 * Trouve la prochaine mission accessible dans une étape.
 * Retourne l'ID de la première mission active non validée,
 * ou null si toutes sont validées.
 */
export function getNextMissionId(
  missions: Array<{ id: string; active: boolean; ordre: number }>,
  progressByMission: Map<string, string>
): string | null {
  // Trie par ordre, ne garde que les actives
  const sorted = [...missions].sort((a, b) => a.ordre - b.ordre);
  for (const m of sorted) {
    if (m.active !== false && progressByMission.get(m.id) !== "valide") {
      return m.id;
    }
  }
  return null;
}

/**
 * Calcule le nombre de missions actives validées dans une étape.
 */
export function countValidatedMissions(
  missions: Array<{ id: string; active: boolean }>,
  progressByMission: Map<string, string>
): number {
  return missions.filter(
    (m) => m.active !== false && progressByMission.get(m.id) === "valide"
  ).length;
}
