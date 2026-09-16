import { Section } from "./Section";

// Une conversation en crescendo : les questions grossissent en descendant,
// la dernière est en train de s'écrire. On module la taille, jamais le
// contraste — chaque ligne reste au-dessus de 5:1 sur le marine.
const PROMPTS = [
  { texte: "Analyse mon offre", taille: "clamp(1.05rem,2vw,1.35rem)", couleur: "text-steel" },
  { texte: "Donne-moi 10 hooks", taille: "clamp(1.2rem,2.5vw,1.65rem)", couleur: "text-steel" },
  {
    texte: "Pourquoi mon funnel ne convertit pas ?",
    taille: "clamp(1.4rem,3vw,2rem)",
    couleur: "text-paper",
  },
  {
    texte: "Écris ma séquence email",
    taille: "clamp(1.6rem,3.6vw,2.5rem)",
    couleur: "text-paper",
  },
];

export function VirtuoseAI() {
  return (
    <Section tone="navy" haut={860} bas={820} intensite={0.6}>
      <h2 className="t-display max-w-[15ch] text-[clamp(2.1rem,5.4vw,3.9rem)] text-paper">
        Et entre deux retours de coach, Virtuose AI.
      </h2>
      <p className="mt-6 max-w-[50ch] text-[1.1875rem] text-steel">
        Il connaît votre offre, votre cible et l&apos;étape où vous en êtes. Vous n&apos;avez pas à
        lui réexpliquer votre activité à chaque fois.
      </p>

      <div className="mt-16 flex flex-col gap-6">
        {PROMPTS.map((prompt, index) => (
          <p
            key={prompt.texte}
            className={`t-display-mid ${prompt.couleur}`}
            style={{ paddingLeft: `${index * 1.5}rem`, fontSize: prompt.taille }}
          >
            {prompt.texte}
            {index === PROMPTS.length - 1 && (
              <span
                aria-hidden="true"
                className="ml-1.5 inline-block h-[0.95em] w-[3px] translate-y-[0.12em] animate-curseur bg-gold align-baseline"
              />
            )}
          </p>
        ))}
      </div>

      <p className="mt-14 text-[1.0625rem] italic text-steel">
        Virtuose AI arrive dans le programme. Les abonnés Pro et Elite y auront accès en premier.
      </p>
    </Section>
  );
}
