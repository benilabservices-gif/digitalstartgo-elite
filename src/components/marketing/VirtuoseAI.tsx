import { Section } from "./Section";

const PROMPTS = [
  "Analyse mon offre",
  "Donne-moi 10 hooks",
  "Pourquoi mon funnel ne convertit pas ?",
  "Écris ma séquence email",
];

export function VirtuoseAI() {
  return (
    <Section tone="dark">
      <h2 className="mb-4 text-center text-3xl font-extrabold sm:text-4xl">Virtuose AI</h2>
      <p className="mx-auto mb-10 max-w-xl text-center text-white/70">
        Un coach funnel disponible en continu, qui connaît votre offre, votre audience et votre
        progression.
      </p>
      <div className="mx-auto flex max-w-xl flex-col gap-3">
        {PROMPTS.map((prompt) => (
          <div
            key={prompt}
            className="self-start rounded-2xl rounded-bl-none bg-white/10 px-4 py-3 text-sm text-white"
          >
            {prompt}
          </div>
        ))}
      </div>
      <p className="mt-8 text-center text-xs uppercase tracking-widest text-white/50">
        Disponible dans le programme
      </p>
    </Section>
  );
}
