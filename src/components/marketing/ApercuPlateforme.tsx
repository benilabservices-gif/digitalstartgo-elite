import { Section } from "./Section";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";

const ETAPES = [
  "Diagnostic",
  "Offre",
  "Cible & Positionnement",
  "Lead Magnet",
  "Acquisition",
  "Mon Funnel",
  "Conversion & Relance",
  "Mesure & Optimisation",
];

export function ApercuPlateforme() {
  return (
    <Section tone="navy" haut={940} bas={900} intensite={0.4}>
      <h2 className="t-display max-w-[17ch] text-[clamp(2.1rem,5.4vw,3.9rem)] text-paper">
        Votre premier jour ressemble à ça.
      </h2>
      <p className="mt-6 max-w-[50ch] text-[1.1875rem] text-steel">
        Pas une bibliothèque de vidéos : une seule mission ouverte, et sept étapes qui attendent
        leur tour.
      </p>

      {/* Le seul élément de la page qui franchit les parois de l'entonnoir :
          le produit déborde du cadre qui contient tout le reste. */}
      <div className="relative mt-14 w-full lg:-mx-16 lg:w-[calc(100%+8rem)]">
        <div className="bg-white">
          <div className="flex items-center justify-between border-b border-dark/10 px-6 py-3.5">
            <p className="t-display-mid text-[0.9375rem] text-dark">Mon Parcours Virtuose</p>
            <p className="t-meta text-[0.8125rem] text-secondary">Jour 1</p>
          </div>

          <div className="px-6 py-6">
            <ProgressBar value={0} label="Progression globale" />

            <div className="mt-7 border-l-[3px] border-gold bg-paper py-4 pl-5 pr-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="t-display-mid text-[1.0625rem] text-dark">
                  Réaliser mon diagnostic funnel
                </p>
                <Badge tone="default">À faire</Badge>
              </div>
              <p className="mt-1.5 text-[0.9375rem] text-secondary">
                Mission 1 sur 3, étape Diagnostic. 12 minutes.
              </p>
            </div>

            <ul className="mt-7">
              {ETAPES.map((etape, index) => (
                <li
                  key={etape}
                  className="flex items-center gap-4 border-t border-dark/8 py-3 first:border-t-0"
                >
                  <span className="t-chiffre w-7 shrink-0 text-[0.8125rem] text-secondary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={`flex-1 text-[0.9375rem] ${index === 0 ? "text-dark" : "text-secondary"}`}
                  >
                    {etape}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`h-[3px] w-16 shrink-0 sm:w-24 ${index === 0 ? "bg-gold" : "bg-dark/10"}`}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
}
