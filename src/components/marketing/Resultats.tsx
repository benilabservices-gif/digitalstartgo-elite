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
      <div className="mb-6 flex items-center justify-center gap-3">
        <h2 className="text-center text-3xl font-extrabold text-dark sm:text-4xl">
          Vos résultats
        </h2>
        <ExempleBadge />
      </div>
      <div className="grid gap-6 sm:grid-cols-4">
        {METRIQUES.map((metrique) => (
          <div key={metrique.label} className="text-center">
            <p className="text-3xl font-extrabold text-royal">{metrique.valeur}</p>
            <p className="text-sm text-secondary">{metrique.label}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
