import { Section } from "./Section";

// Les quatre frictions descendent, se décalent et rétrécissent : le signal
// se perd. Le filet qui les précède raccourcit d'autant. Aucune carte.
const FRICTIONS = [
  {
    titre: "Une offre floue",
    description:
      "Vos prospects ne comprennent pas en une phrase ce que vous vendez ni pourquoi vous.",
    filet: 100,
    taille: "clamp(1.6rem, 3.4vw, 2.4rem)",
    couleur: "#101D38",
    decalage: 0,
  },
  {
    titre: "Une audience sans funnel",
    description: "Vous publiez, mais rien ne transforme vos abonnés en prospects qualifiés.",
    filet: 68,
    taille: "clamp(1.45rem, 3vw, 2.1rem)",
    couleur: "#243356",
    decalage: 5,
  },
  {
    titre: "Des prospects qui ne convertissent jamais",
    description: "Ils s'intéressent, puis disparaissent — aucune relance ne les ramène.",
    filet: 40,
    taille: "clamp(1.3rem, 2.6vw, 1.8rem)",
    couleur: "#3A4767",
    decalage: 10,
  },
  {
    titre: "Aucune mesure de ce qui marche",
    description: "Vous avancez à l'instinct, sans savoir quelle action a réellement un impact.",
    filet: 16,
    taille: "clamp(1.2rem, 2.2vw, 1.55rem)",
    couleur: "#4B5772",
    decalage: 15,
  },
];

export function Probleme() {
  return (
    <Section tone="light" haut={1240} bas={1140} intensite={0.05}>
      <h2 className="t-display max-w-[16ch] text-[clamp(2.1rem,5.4vw,3.9rem)] text-dark">
        Ce n&apos;est pas un problème de trafic.
      </h2>
      <p className="mt-6 max-w-[52ch] text-[1.1875rem] text-secondary">
        C&apos;est un problème de système. Voilà ce qui se passe quand il n&apos;y en a pas : le
        signal s&apos;affaiblit à chaque étape, jusqu&apos;à ne plus rien produire.
      </p>

      <div className="mt-20 flex flex-col gap-14">
        {FRICTIONS.map((friction) => (
          <div
            key={friction.titre}
            style={{ marginLeft: `${friction.decalage}%` }}
            className="max-w-[46ch]"
          >
            <div
              aria-hidden="true"
              className="mb-5 h-px bg-ochre"
              style={{ width: `${friction.filet}%`, opacity: 0.25 + friction.filet / 240 }}
            />
            <h3
              className="t-display-mid"
              style={{ fontSize: friction.taille, color: friction.couleur }}
            >
              {friction.titre}
            </h3>
            <p className="mt-3 text-[1.0625rem]" style={{ color: friction.couleur }}>
              {friction.description}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
