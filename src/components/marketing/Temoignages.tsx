import { Section } from "./Section";
import { ExempleBadge } from "./ExempleBadge";

const TEMOIGNAGES = [
  {
    nom: "Awa",
    metier: "coach business",
    citation: "J'ai enfin un système clair au lieu de poster au hasard chaque jour.",
  },
  {
    nom: "Moussa",
    metier: "formateur",
    citation: "Le feedback de mon coach m'a évité des mois d'erreurs sur mon offre.",
  },
  {
    nom: "Fatou",
    metier: "consultante",
    citation: "Mon funnel tourne enfin sans que j'aie à tout refaire chaque semaine.",
  },
];

export function Temoignages() {
  return (
    <Section tone="light" haut={780} bas={740} intensite={0.76}>
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-3">
        <h2 className="t-display text-[clamp(2.1rem,5.4vw,3.9rem)] text-dark">
          Trois voix du parcours.
        </h2>
        <ExempleBadge />
      </div>

      {/* Après huit sections d'Archivo, la serif italique en grand : c'est le
          changement de voix qui fait l'effet, pas un ornement ajouté. */}
      <div className="mt-16 flex flex-col gap-14">
        {TEMOIGNAGES.map((temoignage, index) => (
          <figure
            key={temoignage.nom}
            className="m-0 max-w-[38ch]"
            style={{ marginLeft: `${index * 7}%` }}
          >
            <blockquote className="text-[clamp(1.35rem,3.4vw,1.95rem)] italic leading-[1.4] text-dark">
              {temoignage.citation}
            </blockquote>
            <figcaption className="mt-4 flex items-center gap-3">
              <span aria-hidden="true" className="h-px w-8 bg-ochre" />
              <span className="t-meta text-[0.9375rem] text-dark">{temoignage.nom}</span>
              <span className="text-[0.9375rem] text-secondary">{temoignage.metier}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}
