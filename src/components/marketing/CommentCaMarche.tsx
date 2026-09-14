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
      <h2 className="mb-10 font-heading text-4xl font-semibold text-dark sm:text-6xl">
        Comment ça marche
      </h2>
      <div className="grid gap-8 border-t border-dark/15 pt-8 sm:grid-cols-4">
        {ETAPES_MACRO.map((etape) => (
          <div key={etape.numero} className="flex flex-col gap-2">
            <span className="border-b border-ochre pb-1 font-heading text-2xl text-ochre">
              {etape.numero}
            </span>
            <h3 className="font-heading text-lg font-semibold text-dark">{etape.titre}</h3>
            <p className="text-secondary">{etape.description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
