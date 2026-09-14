import Link from "next/link";
import { Section } from "./Section";
import { ExempleBadge } from "./ExempleBadge";

const PALIERS = [
  {
    nom: "Starter",
    prix: "49 000 FCFA/mois",
    misEnAvant: false,
    avantages: ["Accès au parcours en 8 étapes", "Ressources et templates", "Communauté"],
  },
  {
    nom: "Pro",
    prix: "99 000 FCFA/mois",
    misEnAvant: true,
    avantages: [
      "Tout Starter",
      "Coaching avec feedback sur chaque mission",
      "Accès à Virtuose AI",
    ],
  },
  {
    nom: "Elite",
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
    <Section tone="light" id="tarifs">
      <div className="mb-10 flex items-baseline gap-3">
        <h2 className="font-heading text-4xl font-semibold text-dark sm:text-6xl">Tarifs</h2>
        <ExempleBadge />
      </div>
      <div className="grid divide-y divide-dark/15 border border-dark/15 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {PALIERS.map((palier) => (
          <div
            key={palier.nom}
            className={`flex flex-col p-6 ${palier.misEnAvant ? "border-t-2 border-ochre sm:border-t-4" : ""}`}
          >
            <p className="mb-1 font-heading text-xl font-semibold text-dark">{palier.nom}</p>
            <p className="mb-6 text-2xl font-semibold text-ochre">{palier.prix}</p>
            <ul className="mb-8 flex flex-1 flex-col gap-2 text-secondary">
              {palier.avantages.map((avantage) => (
                <li key={avantage}>{avantage}</li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="rounded-sm bg-ochre px-4 py-2 text-center font-semibold text-ink transition hover:bg-amber"
            >
              Construire mon système de vente
            </Link>
          </div>
        ))}
      </div>
    </Section>
  );
}
