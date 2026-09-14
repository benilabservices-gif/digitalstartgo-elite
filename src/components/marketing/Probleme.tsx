import { Section } from "./Section";
import { Card } from "@/components/ui/Card";

const FRICTIONS = [
  {
    titre: "Une offre floue",
    description:
      "Vos prospects ne comprennent pas en une phrase ce que vous vendez ni pourquoi vous.",
  },
  {
    titre: "Une audience sans funnel",
    description: "Vous publiez, mais rien ne transforme vos abonnés en prospects qualifiés.",
  },
  {
    titre: "Des prospects qui ne convertissent jamais",
    description: "Ils s'intéressent, puis disparaissent — aucune relance ne les ramène.",
  },
  {
    titre: "Aucune mesure de ce qui marche",
    description: "Vous avancez à l'instinct, sans savoir quelle action a réellement un impact.",
  },
];

export function Probleme() {
  return (
    <Section tone="light">
      <h2 className="mb-10 text-center text-3xl font-extrabold text-dark sm:text-4xl">
        La plupart des entrepreneurs n&apos;ont pas un problème de trafic.
        <br />
        Ils ont un problème de système.
      </h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {FRICTIONS.map((friction) => (
          <Card key={friction.titre} title={friction.titre}>
            <p className="text-secondary">{friction.description}</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}
