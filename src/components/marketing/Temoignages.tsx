import { Section } from "./Section";
import { Card } from "@/components/ui/Card";
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
      <div className="mb-10 flex items-center justify-center gap-3">
        <h2 className="text-center text-3xl font-extrabold text-dark sm:text-4xl">
          Ce qu&apos;en disent les participants
        </h2>
        <ExempleBadge />
      </div>
      <div className="grid gap-6 sm:grid-cols-3">
        {TEMOIGNAGES.map((temoignage) => (
          <Card key={temoignage.nom}>
            <p className="mb-4 text-dark">&laquo; {temoignage.citation} &raquo;</p>
            <p className="text-sm font-semibold text-secondary">{temoignage.nom}</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}
