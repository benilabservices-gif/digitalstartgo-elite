import Link from "next/link";
import { Section } from "./Section";
import { Card } from "@/components/ui/Card";
import { ExempleBadge } from "./ExempleBadge";

const PALIERS = [
  {
    nom: "STARTER",
    prix: "49 000 FCFA/mois",
    misEnAvant: false,
    avantages: ["Accès au parcours en 8 étapes", "Ressources et templates", "Communauté"],
  },
  {
    nom: "PRO",
    prix: "99 000 FCFA/mois",
    misEnAvant: true,
    avantages: [
      "Tout Starter",
      "Coaching avec feedback sur chaque mission",
      "Accès à Virtuose AI",
    ],
  },
  {
    nom: "ELITE",
    prix: "199 000 FCFA/mois",
    misEnAvant: false,
    avantages: [
      "Tout Pro",
      "Sessions de coaching individuelles",
      "Revue prioritaire des livrables",
    ],
  },
];

export function Pricing() {
  return (
    <Section tone="light">
      <div className="mb-10 flex items-center justify-center gap-3">
        <h2 className="text-center text-3xl font-extrabold text-dark sm:text-4xl">Tarifs</h2>
        <ExempleBadge />
      </div>
      <div className="grid items-start gap-6 sm:grid-cols-3">
        {PALIERS.map((palier) => (
          <div
            key={palier.nom}
            className={palier.misEnAvant ? "rounded-xl border-2 border-royal" : ""}
          >
            <Card title={palier.nom}>
              <p className="mb-4 text-2xl font-extrabold text-dark">{palier.prix}</p>
              <ul className="mb-6 flex flex-col gap-2 text-secondary">
                {palier.avantages.map((avantage) => (
                  <li key={avantage}>{avantage}</li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block rounded-lg bg-royal px-4 py-2 text-center font-semibold text-white transition hover:bg-electric"
              >
                Construire mon système de vente
              </Link>
            </Card>
          </div>
        ))}
      </div>
    </Section>
  );
}
