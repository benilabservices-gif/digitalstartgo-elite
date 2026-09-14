import Link from "next/link";
import { Section } from "./Section";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const ETAPES = [
  { numero: 1, titre: "Diagnostic", objectif: "Évaluer l'état actuel de votre système de vente." },
  {
    numero: 2,
    titre: "Offre",
    objectif: "Transformer votre expertise en une offre claire et désirable.",
  },
  {
    numero: 3,
    titre: "Cible & Positionnement",
    objectif: "Définir précisément qui vous servez et pourquoi vous.",
  },
  { numero: 4, titre: "Lead Magnet", objectif: "Créer une ressource qui capture vos prospects." },
  { numero: 5, titre: "Acquisition", objectif: "Mettre en place vos canaux de trafic." },
  {
    numero: 6,
    titre: "Mon Funnel",
    objectif: "Construire un funnel complet de la landing page au checkout.",
  },
  {
    numero: 7,
    titre: "Conversion & Relance",
    objectif: "Optimiser votre page de vente et vos séquences de relance.",
  },
  {
    numero: 8,
    titre: "Mesure & Optimisation",
    objectif: "Suivre vos métriques et améliorer en continu.",
  },
];

export function LesHuitEtapes() {
  return (
    <Section tone="light">
      <h2 className="mb-10 text-center text-3xl font-extrabold text-dark sm:text-4xl">
        Le programme en 8 étapes
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {ETAPES.map((etape) => (
          <Card
            key={etape.numero}
            title={`${String(etape.numero).padStart(2, "0")} — ${etape.titre}`}
          >
            <p className="mb-4 text-secondary">{etape.objectif}</p>
            {etape.numero === 1 && (
              <div className="flex flex-col gap-2">
                <Badge tone="success">Commencez ici</Badge>
                <Link href="/signup" className="text-sm font-semibold text-royal hover:underline">
                  Faire mon diagnostic →
                </Link>
              </div>
            )}
          </Card>
        ))}
      </div>
    </Section>
  );
}
