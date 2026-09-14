import { Section } from "./Section";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";

const APERCU_ETAPES: { titre: string; statut: string; tone: "success" | "warning" | "default" }[] = [
  { titre: "01 Diagnostic", statut: "Validé", tone: "success" },
  { titre: "02 Offre", statut: "Validé", tone: "success" },
  { titre: "03 Cible & Positionnement", statut: "En cours", tone: "warning" },
  { titre: "04 Lead Magnet", statut: "À faire", tone: "default" },
];

export function ApercuPlateforme() {
  return (
    <Section tone="dark">
      <h2 className="mb-4 text-center text-3xl font-extrabold sm:text-4xl">
        Voici à quoi ressemble votre tableau de bord dès votre premier jour.
      </h2>
      <p className="mx-auto mb-10 max-w-xl text-center text-white/70">
        Mon Parcours Virtuose : votre progression, votre mission en cours, et les étapes qui vous
        rapprochent de votre prochain client.
      </p>
      <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 text-dark shadow-lg">
        <div className="mb-6">
          <ProgressBar value={25} label="Progression globale" />
        </div>
        <div className="mb-6">
          <Card title="Mission 03">
            <p className="mb-3">Clarifier ma cible et mon positionnement</p>
            <Badge tone="warning">En cours</Badge>
          </Card>
        </div>
        <ul className="flex flex-col gap-3">
          {APERCU_ETAPES.map((etape) => (
            <li key={etape.titre} className="flex items-center justify-between">
              <span>{etape.titre}</span>
              <Badge tone={etape.tone}>{etape.statut}</Badge>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
