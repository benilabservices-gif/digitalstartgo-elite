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
      <h2 className="mb-4 font-heading text-4xl font-semibold sm:text-6xl">Virtuose AI</h2>
      <p className="mb-10 max-w-xl text-white/70">
        Un coach funnel disponible en continu, qui connaît votre offre, votre audience et votre
        progression.
      </p>
      <div className="flex max-w-xl flex-col gap-3 border-l-2 border-ochre pl-6">
        {PROMPTS.map((prompt) => (
          <p key={prompt} className="text-white/90">
            « {prompt} »
          </p>
        ))}
      </div>
      <p className="mt-8 font-heading italic text-white/60">Disponible dans le programme.</p>
    </Section>
  );
}
