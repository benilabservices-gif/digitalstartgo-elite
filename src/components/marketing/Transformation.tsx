import { Section } from "./Section";

const AVANT = [
  "Vous dispersez vos efforts",
  "Vous devinez ce qui pourrait marcher",
  "Vous publiez au hasard",
];
const APRES = [
  "Vous suivez un système structuré",
  "Vous exécutez des actions guidées",
  "Vous mesurez chaque résultat",
];

export function Transformation() {
  return (
    <Section tone="light">
      <h2 className="mb-10 font-heading text-4xl font-semibold text-dark sm:text-6xl">
        La transformation Virtuose Funnel
      </h2>
      <div className="grid divide-y divide-dark/15 border-y border-dark/15 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <div className="py-6 pr-0 sm:pr-8">
          <p className="mb-4 font-heading text-lg italic text-secondary">Avant</p>
          <ul className="flex flex-col gap-3 text-secondary">
            {AVANT.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="border-l-2 border-ochre py-6 pl-6 sm:pl-8">
          <p className="mb-4 font-heading text-lg italic text-ochre">Après</p>
          <ul className="flex flex-col gap-3 text-dark">
            {APRES.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
