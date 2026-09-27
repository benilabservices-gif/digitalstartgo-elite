// Les fichiers de la bibliothèque sont réservés aux abonnés actifs.
// Coachs et admins y ont toujours accès (ils accompagnent les participants).
export function peutTelechargerRessource(
  role: string | null | undefined,
  finAbonnement: string | null | undefined,
  maintenant: Date = new Date()
): boolean {
  if (role === "admin" || role === "coach") return true;
  if (!finAbonnement) return false;
  return new Date(finAbonnement).getTime() > maintenant.getTime();
}
