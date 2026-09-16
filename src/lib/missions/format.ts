const DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  // Fixé explicitement : le rendu est fait sur le serveur, on veut une date
  // stable quel que soit le fuseau de la machine qui exécute Next.
  timeZone: "UTC",
});

export function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : DATE_FORMATTER.format(date);
}
