import { Section } from "./Section";

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
    <Section tone="light" id="comment-ca-marche">
      <h2 className="mb-10 text-center text-3xl font-extrabold text-dark sm:text-4xl">
        Comment ça marche
      </h2>
      <div className="grid gap-8 sm:grid-cols-4">
        {ETAPES_MACRO.map((etape) => (
          <div
            key={etape.numero}
            className="flex flex-col items-center text-center sm:items-start sm:text-left"
          >
            <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-royal text-lg font-bold text-white">
              {etape.numero}
            </span>
            <h3 className="mb-2 text-lg font-bold text-dark">{etape.titre}</h3>
            <p className="text-secondary">{etape.description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
