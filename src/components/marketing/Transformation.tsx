import { Section } from "./Section";

const AVANT = [
  "Vous dispersez vos efforts",
  "Vous devinez ce qui pourrait marcher",
  "Vous publiez au hasard",
];
const APRES = [
  "Vous suivez un système structuré",
  "Vous exécutez des actions guidées",
  "Vous mesurez chaque résultat",
];

// À gauche, onze traits désordonnés. Ils traversent la barre or et
// ressortent parallèles, puis convergent vers un point unique : la vente.
const DESORDRE = [
  [12, 18, 46, 9],
  [6, 34, 38, 27],
  [22, 52, 52, 61],
  [4, 68, 41, 76],
  [18, 88, 49, 82],
  [9, 105, 44, 112],
  [25, 122, 51, 131],
  [3, 140, 39, 133],
  [16, 156, 47, 164],
  [11, 172, 43, 168],
  [21, 6, 50, 15],
] as const;

const ORDRE = [9, 25, 41, 57, 73, 89, 105, 121, 137, 153, 169] as const;

export function Transformation() {
  return (
    <Section tone="light" haut={1140} bas={1060} intensite={0.12}>
      <h2 className="t-display max-w-[14ch] text-[clamp(2.1rem,5.4vw,3.9rem)] text-dark">
        Le même effort, canalisé.
      </h2>

      <div className="mt-16">
        <svg
          viewBox="0 0 620 180"
          className="h-auto w-full"
          role="img"
          aria-label="Schéma : des efforts dispersés à gauche traversent le système et ressortent alignés vers un point de vente unique à droite."
        >
          {DESORDRE.map(([x1, y1, x2, y2]) => (
            <line
              key={`${x1}-${y1}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#4B5772"
              strokeOpacity="0.55"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          ))}

          {/* Le système : une barre pleine, franche. */}
          <rect x="248" y="0" width="7" height="180" fill="#F0B928" />
          <text
            x="238"
            y="94"
            textAnchor="end"
            fill="#7E5B0E"
            fontSize="11"
            fontWeight="600"
            fontFamily="var(--font-archivo), sans-serif"
          >
            avant
          </text>
          <text
            x="266"
            y="94"
            fill="#7E5B0E"
            fontSize="11"
            fontWeight="600"
            fontFamily="var(--font-archivo), sans-serif"
          >
            après
          </text>

          {ORDRE.map((y) => (
            <path
              key={y}
              d={`M 266 ${y} L 470 ${y} Q 545 ${y} 596 90`}
              fill="none"
              stroke="#101D38"
              strokeOpacity="0.72"
              strokeWidth="1.5"
            />
          ))}
          <circle cx="601" cy="90" r="6" fill="#F0B928" />
          <circle cx="601" cy="90" r="6" fill="none" stroke="#101D38" strokeWidth="1.5" />
        </svg>
      </div>

      <div className="mt-14 grid gap-10 sm:grid-cols-2">
        <ul className="flex flex-col gap-2.5 text-[1.0625rem] text-secondary">
          {AVANT.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <ul className="flex flex-col gap-2.5 text-[1.0625rem] text-dark">
          {APRES.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
