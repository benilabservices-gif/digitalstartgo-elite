export const LARGEUR_ENTONNOIR = 1240;

type Tone = "dark" | "light" | "navy";

const fondClasses: Record<Tone, string> = {
  dark: "bg-ink text-paper",
  navy: "bg-navy text-paper",
  light: "bg-paper text-dark",
};

/**
 * Les deux parois de l'entonnoir. Chaque section en dessine son segment :
 * bout à bout, elles forment un tracé continu du Hero jusqu'au col (les tarifs),
 * puis s'évasent à la sortie. Visibles seulement là où il y a de la marge.
 */
function ParoiEntonnoir({
  haut,
  bas,
  tone,
  intensite,
}: {
  haut: number;
  bas: number;
  tone: Tone;
  intensite: number;
}) {
  const gaucheHaut = (LARGEUR_ENTONNOIR - haut) / 2;
  const gaucheBas = (LARGEUR_ENTONNOIR - bas) / 2;
  const trait = tone === "light" ? "#7E5B0E" : "#F0B928";
  const opacite = (tone === "light" ? 0.18 : 0.24) + intensite * 0.4;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 hidden justify-center xl:flex"
    >
      <svg
        viewBox={`0 0 ${LARGEUR_ENTONNOIR} 100`}
        preserveAspectRatio="none"
        className="h-full"
        style={{ width: LARGEUR_ENTONNOIR }}
      >
        <line
          x1={gaucheHaut}
          y1={0}
          x2={gaucheBas}
          y2={100}
          stroke={trait}
          strokeOpacity={opacite}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1={LARGEUR_ENTONNOIR - gaucheHaut}
          y1={0}
          x2={LARGEUR_ENTONNOIR - gaucheBas}
          y2={100}
          stroke={trait}
          strokeOpacity={opacite}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

export function Section({
  tone,
  id,
  haut = LARGEUR_ENTONNOIR,
  bas = LARGEUR_ENTONNOIR,
  intensite = 0,
  children,
}: {
  tone: Tone;
  id?: string;
  /** Largeur interne de l'entonnoir au bord haut de la section, en px. */
  haut?: number;
  /** Largeur interne au bord bas. C'est elle qui borne la colonne de contenu. */
  bas?: number;
  /** 0 → 1 : la paroi se charge en couleur à mesure qu'on descend. */
  intensite?: number;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`relative ${fondClasses[tone]}`}>
      <ParoiEntonnoir haut={haut} bas={bas} tone={tone} intensite={intensite} />
      <div
        className="relative mx-auto px-6 py-24 sm:py-32"
        style={{ maxWidth: `min(${bas - 96}px, 100%)` }}
      >
        {children}
      </div>
    </section>
  );
}
