import { Section } from "./Section";
import { ExempleBadge } from "./ExempleBadge";

const METRIQUES = [
  { label: "Leads", valeur: "428" },
  { label: "Taux de conversion", valeur: "6,2 %" },
  { label: "Ventes", valeur: "37" },
  { label: "Revenu", valeur: "1 110 000 FCFA" },
];

export function Resultats() {
  return (
    <Section tone="light">
      <div className="mb-10 flex items-baseline gap-3">
        <h2 className="font-heading text-4xl font-semibold text-dark sm:text-6xl">
          Vos résultats
        </h2>
        <ExempleBadge />
      </div>
      <div className="grid divide-y divide-dark/15 border-y border-dark/15 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
        {METRIQUES.map((metrique) => (
          <div key={metrique.label} className="py-6 sm:px-6 sm:first:pl-0">
            <p className="font-heading text-4xl font-semibold text-ochre">{metrique.valeur}</p>
            <p className="mt-1 text-sm text-secondary">{metrique.label}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
