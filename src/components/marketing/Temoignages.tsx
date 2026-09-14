import { Section } from "./Section";
import { ExempleBadge } from "./ExempleBadge";

const TEMOIGNAGES = [
  {
    nom: "Awa, coach business",
    citation: "J'ai enfin un système clair au lieu de poster au hasard chaque jour.",
  },
  {
    nom: "Moussa, formateur",
    citation: "Le feedback de mon coach m'a évité des mois d'erreurs sur mon offre.",
  },
  {
    nom: "Fatou, consultante",
    citation: "Mon funnel tourne enfin sans que j'aie à tout refaire chaque semaine.",
  },
];

export function Temoignages() {
  return (
    <Section tone="light">
      <div className="mb-10 flex items-baseline gap-3">
        <h2 className="font-heading text-4xl font-semibold text-dark sm:text-6xl">
          Ce qu&apos;en disent les participants
        </h2>
        <ExempleBadge />
      </div>
      <div className="grid gap-8 sm:grid-cols-3">
        {TEMOIGNAGES.map((temoignage) => (
          <div key={temoignage.nom} className="border-l-2 border-dark/20 pl-5">
            <p className="mb-3 font-heading text-lg italic text-dark">{temoignage.citation}</p>
            <p className="text-sm text-secondary">{temoignage.nom}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
