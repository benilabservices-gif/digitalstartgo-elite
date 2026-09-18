import Link from "next/link";
import { Section } from "./Section";
import { PLANS, formatXof } from "@/lib/subscriptions/plans";

// Les prix viennent de src/lib/subscriptions/plans.ts (source unique) : ne
// jamais redéfinir un montant ici, ça désynchroniserait la promesse affichée
// et ce qui est réellement facturé.
const PALIERS = [
  {
    nom: PLANS.starter.name,
    prix: formatXof(PLANS.starter.amountXof),
    periode: "par mois",
    misEnAvant: false,
    avantages: ["Accès au parcours en 8 étapes", "Ressources et templates", "Communauté"],
  },
  {
    nom: PLANS.pro.name,
    prix: formatXof(PLANS.pro.amountXof),
    periode: "par mois",
    misEnAvant: true,
    avantages: ["Tout Starter", "Coaching avec feedback sur chaque mission", "Accès à Virtuose AI"],
  },
  {
    nom: PLANS.elite.name,
    prix: formatXof(PLANS.elite.amountXof),
    periode: "par mois",
    misEnAvant: false,
    avantages: ["Tout Pro", "Sessions de coaching individuelles", "Revue prioritaire des livrables"],
  },
];

export function Pricing() {
  return (
    <Section tone="light" id="tarifs" haut={740} bas={700} intensite={0.88}>
      <h2 className="t-display max-w-[13ch] text-[clamp(2.1rem,5.4vw,3.9rem)] text-dark">
        Le col de l&apos;entonnoir.
      </h2>
      <p className="mt-6 max-w-[50ch] text-[1.1875rem] text-secondary">
        C&apos;est l&apos;endroit le plus étroit de la page, et le seul choix qu&apos;il vous reste
        à faire. Sans engagement de durée.
      </p>

      <div className="mt-14 flex flex-col gap-4">
        {PALIERS.map((palier) => (
          <div
            key={palier.nom}
            className={
              palier.misEnAvant
                ? // Le seul élément de la page qui franchit la paroi du col.
                  "bg-ink px-6 py-7 text-paper sm:px-8 lg:-mx-14 lg:px-14"
                : "border border-dark/15 px-6 py-7 sm:px-8"
            }
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <h3
                className={`t-display-mid text-[clamp(1.35rem,3vw,1.85rem)] ${
                  palier.misEnAvant ? "text-paper" : "text-dark"
                }`}
              >
                {palier.nom}
              </h3>
              <p className="flex items-baseline gap-2">
                <span
                  className={`t-chiffre text-[clamp(1.5rem,3.6vw,2.15rem)] ${
                    palier.misEnAvant ? "text-gold" : "text-dark"
                  }`}
                >
                  {palier.prix}
                </span>
                <span
                  className={`text-[0.9375rem] ${
                    palier.misEnAvant ? "text-steel" : "text-secondary"
                  }`}
                >
                  {palier.periode}
                </span>
              </p>
            </div>

            <ul
              className={`mt-5 flex flex-col gap-1.5 text-[1.0625rem] ${
                palier.misEnAvant ? "text-steel" : "text-secondary"
              }`}
            >
              {palier.avantages.map((avantage) => (
                <li key={avantage}>{avantage}</li>
              ))}
            </ul>

            <Link
              href="/signup"
              className={`t-meta mt-7 inline-block rounded-[3px] px-6 py-3 text-[1rem] transition-colors ${
                palier.misEnAvant
                  ? "bg-gold text-ink hover:bg-amber"
                  : "border border-dark/25 text-dark hover:border-dark/60"
              }`}
            >
              Construire mon système de vente
            </Link>
          </div>
        ))}
      </div>
    </Section>
  );
}
