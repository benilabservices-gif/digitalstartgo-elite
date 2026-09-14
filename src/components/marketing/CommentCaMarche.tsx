import { Section } from "./Section";

// Une vraie séquence : les numéros sont donc légitimes.
const ETAPES_MACRO = [
  {
    numero: "1",
    titre: "Diagnostiquez",
    description: "Évaluez votre système actuel et obtenez votre Funnel Score.",
  },
  {
    numero: "2",
    titre: "Suivez le parcours guidé",
    description: "Avancez mission par mission, à votre rythme.",
  },
  {
    numero: "3",
    titre: "Soumettez et corrigez",
    description: "Recevez un retour de coach, ajustez, validez.",
  },
  {
    numero: "4",
    titre: "Lancez et mesurez",
    description: "Mettez votre système en ligne et suivez vos résultats.",
  },
];

export function CommentCaMarche() {
  return (
    <Section tone="light" id="comment-ca-marche" haut={1060} bas={1000} intensite={0.2}>
      <h2 className="t-display max-w-[15ch] text-[clamp(2.1rem,5.4vw,3.9rem)] text-dark">
        Quatre temps, et vous êtes en ligne.
      </h2>

      {/* Chaque temps est une marche : un giron (le filet horizontal en tête de
          colonne) et une contremarche (le filet vertical qui descend vers le
          temps suivant). Décalage réglé dans globals.css, où les colonnes existent. */}
      <ol className="escalier mt-16 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        {ETAPES_MACRO.map((etape, index) => (
          <li
            key={etape.numero}
            className="relative border-t-2 border-ochre/40 pt-5"
            style={{ ["--pas" as string]: index }}
          >
            {index < ETAPES_MACRO.length - 1 && (
              <span
                aria-hidden="true"
                className="absolute -right-4 top-0 hidden h-10 w-[2px] bg-ochre/40 lg:block"
              />
            )}
            <span className="t-chiffre block text-[2.5rem] leading-none text-ochre">
              {etape.numero}
            </span>
            <h3 className="t-display-mid mt-4 text-[1.25rem] text-dark">{etape.titre}</h3>
            <p className="mt-2 text-[1.0625rem] text-secondary">{etape.description}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
