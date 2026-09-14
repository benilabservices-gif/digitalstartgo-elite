import { Section } from "./Section";
import { Card } from "@/components/ui/Card";

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
      <h2 className="mb-10 text-center text-3xl font-extrabold text-dark sm:text-4xl">
        La transformation Virtuose Funnel
      </h2>
      <div className="grid gap-6 sm:grid-cols-2">
        <Card title="Avant">
          <ul className="flex flex-col gap-3 text-secondary">
            {AVANT.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
        <Card title="Après">
          <ul className="flex flex-col gap-3 text-dark">
            {APRES.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
      </div>
    </Section>
  );
}
