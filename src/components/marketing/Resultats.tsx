import { Section } from "./Section";
import { ExempleBadge } from "./ExempleBadge";

// Les quatre métriques ne sont pas quatre chiffres côte à côte : c'est un
// entonnoir. La section montre enfin, en dur, la forme que la page dessine
// depuis le début.
const PALIERS = [
  { label: "Leads collectés", valeur: "428", largeur: 100 },
  { label: "Taux de conversion", valeur: "6,2 %", largeur: 76 },
  { label: "Ventes conclues", valeur: "37", largeur: 52 },
  { label: "Revenu généré", valeur: "1 110 000 FCFA", largeur: 30 },
];

export function Resultats() {
  return (
    <Section tone="light" haut={820} bas={780} intensite={0.68}>
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-3">
        <h2 className="t-display text-[clamp(2.1rem,5.4vw,3.9rem)] text-dark">
          Ce que vous regardez à la fin.
        </h2>
        <ExempleBadge />
      </div>
      <p className="mt-6 max-w-[52ch] text-[1.1875rem] text-secondary">
        Un tableau de bord qui se lit de haut en bas, dans l&apos;ordre où l&apos;argent circule.
        Les chiffres ci-dessous sont une illustration, pas une promesse.
      </p>

      <ol className="mt-14 flex flex-col items-center gap-3">
        {PALIERS.map((palier, index) => {
          const dernier = index === PALIERS.length - 1;
          return (
            <li
              key={palier.label}
              style={{ width: `max(15rem, ${palier.largeur}%)` }}
              className={`flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-5 py-5 sm:px-7 ${
                dernier ? "bg-gold text-ink" : "border border-ochre/35 text-dark"
              }`}
            >
              <span
                className={`t-meta text-[0.875rem] ${dernier ? "text-ink/80" : "text-secondary"}`}
              >
                {palier.label}
              </span>
              <span className="t-chiffre text-[clamp(1.5rem,4vw,2.5rem)] leading-none">
                {palier.valeur}
              </span>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
