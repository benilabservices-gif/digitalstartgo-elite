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
    <Section tone="light" haut={900} bas={860} intensite={0.5}>
      <h2 className="t-display max-w-[16ch] text-[clamp(2.1rem,5.4vw,3.9rem)] text-dark">
        Quelqu&apos;un relit vraiment ce que vous écrivez.
      </h2>
      <p className="mt-6 max-w-[52ch] text-[1.1875rem] text-secondary">
        Virtuose Funnel n&apos;est pas une formation qu&apos;on regarde. C&apos;est un travail
        qu&apos;on rend, et qui revient annoté.
      </p>

      {/* Montrer le feedback plutôt que le décrire : un livrable réel, la phrase
          qui coince surlignée, et la note du coach rattachée dans la marge. */}
      <div className="mt-14 lg:grid lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-10">
        <figure className="m-0 border border-dark/12 bg-white p-6 sm:p-8">
          <figcaption className="t-meta mb-5 text-[0.8125rem] text-secondary">
            Livrable soumis, étape 2 : Offre
          </figcaption>
          <p className="max-w-[58ch] text-[1.0625rem] leading-[1.75] text-dark">
            J&apos;accompagne les entrepreneurs à structurer leur activité grâce à un
            accompagnement sur mesure.{" "}
            <span className="relative inline">
              <span className="relative z-10">
                Mon offre s&apos;adresse à toute personne qui veut développer son business.
              </span>
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-[0.05em] z-0 h-[0.55em] bg-gold/45"
              />
            </span>{" "}
            Je propose un suivi de trois mois avec des points réguliers.
          </p>
        </figure>

        <aside className="relative mt-6 border-l-[3px] border-gold bg-paper py-5 pl-5 pr-4 lg:mt-24 lg:bg-transparent">
          <p className="t-meta mb-2 text-[0.8125rem] text-ochre">Retour de coach</p>
          <p className="text-[0.9375rem] leading-relaxed text-dark">
            « Toute personne qui veut développer son business », ce n&apos;est encore personne.
            Nomme un métier et un moment précis, puis resoumets.
          </p>
        </aside>
      </div>

      <ol className="mt-16 grid gap-x-8 gap-y-10 sm:grid-cols-3">
        {POINTS.map((point, index) => (
          <li key={point.titre}>
            <div className="mb-4 flex items-center gap-3">
              <span className="t-chiffre text-[1.5rem] leading-none text-ochre">{index + 1}</span>
              <span aria-hidden="true" className="h-px flex-1 bg-ochre/30" />
            </div>
            <h3 className="t-display-mid text-[1.1875rem] text-dark">{point.titre}</h3>
            <p className="mt-2 text-[1.0625rem] text-secondary">{point.description}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
