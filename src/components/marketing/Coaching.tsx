import { Section } from "./Section";

const POINTS = [
  {
    titre: "Vous soumettez",
    description: "Chaque mission se termine par un livrable concret que vous soumettez.",
  },
  {
    titre: "Votre coach corrige",
    description: "Un humain relit votre travail et vous dit précisément quoi ajuster.",
  },
  {
    titre: "Vous avancez avec confiance",
    description: "Vous ne passez à l'étape suivante qu'une fois votre mission validée.",
  },
];

export function Coaching() {
  return (
    <Section tone="light">
      <h2 className="mb-4 max-w-xl font-heading text-4xl font-semibold text-dark sm:text-6xl">
        Un humain valide chaque étape de votre progression.
      </h2>
      <p className="mb-10 max-w-xl text-secondary">
        Virtuose Funnel n&apos;est pas une formation vidéo qu&apos;on regarde. C&apos;est un
        accompagnement qu&apos;on exécute, avec un coach qui vérifie chaque livrable.
      </p>
      <div className="grid gap-8 border-t border-dark/15 pt-8 sm:grid-cols-3">
        {POINTS.map((point, index) => (
          <div key={point.titre}>
            <p className="mb-2 font-heading text-2xl text-ochre">{index + 1}</p>
            <h3 className="mb-2 font-heading text-lg font-semibold text-dark">{point.titre}</h3>
            <p className="text-secondary">{point.description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
