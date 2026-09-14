import Link from "next/link";
import { Section } from "./Section";
import { Badge } from "@/components/ui/Badge";

// Contenu produit réel : ces huit intitulés et objectifs sont ceux de
// supabase/seed.sql, mot pour mot.
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
    <Section tone="light" id="les-etapes" haut={1000} bas={940} intensite={0.3}>
      <h2 className="t-display max-w-[15ch] text-[clamp(2.1rem,5.4vw,3.9rem)] text-dark">
        Le parcours, marche par marche.
      </h2>
      <p className="mt-6 max-w-[54ch] text-[1.1875rem] text-secondary">
        Chaque étape ferme une faille du système. Le filet sous chaque ligne montre où vous en êtes
        rendu quand vous la validez.
      </p>

      <ol className="mt-16">
        {ETAPES.map((etape, index) => {
          const avancement = ((index + 1) / ETAPES.length) * 100;
          return (
            <li key={etape.numero} className="group border-t border-dark/10 py-7 first:border-t-0">
              <div className="flex flex-col gap-x-8 gap-y-3 sm:flex-row sm:items-baseline">
                <span className="t-chiffre w-12 shrink-0 text-[1.5rem] leading-none text-ochre">
                  {String(etape.numero).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="t-display-mid text-[clamp(1.25rem,2.6vw,1.75rem)] text-dark">
                    {etape.titre}
                  </h3>
                  <p className="mt-1.5 max-w-[52ch] text-[1.0625rem] text-secondary">
                    {etape.objectif}
                  </p>
                  {etape.numero === 1 && (
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      <Badge tone="success">Commencez ici</Badge>
                      <Link
                        href="/signup"
                        className="t-meta text-[0.9375rem] text-ochre underline decoration-ochre/40 underline-offset-4 hover:decoration-ochre"
                      >
                        Faire mon diagnostic
                      </Link>
                    </div>
                  )}
                </div>
                <span className="t-meta shrink-0 self-start text-[0.8125rem] text-secondary sm:self-baseline">
                  {Math.round(avancement)}%
                </span>
              </div>

              {/* La jauge se remplit d'une marche à l'autre : à la huitième,
                  la ligne est pleine. C'est la ProgressBar du produit, à l'échelle
                  de la section. */}
              <div aria-hidden="true" className="mt-5 h-[3px] w-full bg-dark/8">
                <div className="h-full bg-gold" style={{ width: `${avancement}%` }} />
              </div>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
