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
      <h2 className="mb-4 text-center text-3xl font-extrabold text-dark sm:text-4xl">
        Un humain valide chaque étape de votre progression.
      </h2>
      <p className="mx-auto mb-10 max-w-xl text-center text-secondary">
        Virtuose Funnel n&apos;est pas une formation vidéo qu&apos;on regarde. C&apos;est un
        accompagnement qu&apos;on exécute, avec un coach qui vérifie chaque livrable.
      </p>
      <div className="grid gap-6 sm:grid-cols-3">
        {POINTS.map((point) => (
          <div key={point.titre} className="text-center">
            <h3 className="mb-2 text-lg font-bold text-dark">{point.titre}</h3>
            <p className="text-secondary">{point.description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
