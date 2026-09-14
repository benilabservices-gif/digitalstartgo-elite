import { Section } from "./Section";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";

const ETAPES = [
  "01 Diagnostic",
  "02 Offre",
  "03 Cible & Positionnement",
  "04 Lead Magnet",
  "05 Acquisition",
  "06 Mon Funnel",
  "07 Conversion & Relance",
  "08 Mesure & Optimisation",
];

export function ApercuPlateforme() {
  return (
    <Section tone="dark">
      <h2 className="mb-4 max-w-xl font-heading text-4xl font-semibold sm:text-6xl">
        Voici à quoi ressemble votre tableau de bord dès votre premier jour.
      </h2>
      <p className="mb-10 max-w-xl text-white/70">
        Mon Parcours Virtuose : votre progression, votre première mission, et les étapes qui vous
        rapprochent de votre prochain client.
      </p>
      <div className="mx-auto max-w-2xl border border-white/20 bg-white p-6 text-dark">
        <div className="mb-6">
          <ProgressBar value={0} label="Progression globale" />
        </div>
        <div className="mb-6">
          <Card title="Mission 01">
            <p className="mb-3">Réaliser mon diagnostic funnel</p>
            <Badge tone="default">À faire</Badge>
          </Card>
        </div>
        <ul className="flex flex-col gap-3">
          {ETAPES.map((etape) => (
            <li key={etape} className="flex items-center justify-between">
              <span>{etape}</span>
              <Badge tone="default">À faire</Badge>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
