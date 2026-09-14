import Link from "next/link";
import { PlaqueLogo } from "./LogoVirtuose";
import { LARGEUR_ENTONNOIR } from "./Section";

/**
 * La sortie. Après le col des tarifs, les parois s'écartent d'un coup : c'est
 * la flèche du logo qui remonte. Le titre est le plus grand de toute la page.
 */
export function CtaFinal() {
  return (
    <footer className="relative overflow-hidden bg-ink px-6 pb-16 pt-28 text-paper sm:pt-36">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex justify-center">
        <svg
          viewBox={`0 0 ${LARGEUR_ENTONNOIR} 100`}
          preserveAspectRatio="none"
          className="h-full w-full max-w-[1240px] overflow-visible"
        >
          <line
            x1={270}
            y1={0}
            x2={-320}
            y2={100}
            stroke="#F0B928"
            strokeOpacity="0.5"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={970}
            y1={0}
            x2={1560}
            y2={100}
            stroke="#F0B928"
            strokeOpacity="0.5"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      <div className="relative mx-auto max-w-[1000px]">
        <h2 className="t-display max-w-[16ch] text-[clamp(2.9rem,10vw,7rem)]">
          Il vous manque un système, pas du courage.
        </h2>

        <div className="mt-12 flex flex-wrap items-center gap-x-9 gap-y-5">
          <Link
            href="/signup"
            className="t-meta rounded-[3px] bg-gold px-8 py-4 text-[1.0625rem] text-ink transition-colors hover:bg-amber"
          >
            Construire mon système de vente
          </Link>
          <Link
            href="/login"
            className="t-meta text-[1.0625rem] text-steel underline-offset-4 transition-colors hover:text-paper hover:underline"
          >
            Se connecter
          </Link>
        </div>

        <div className="mt-24 flex flex-wrap items-end justify-between gap-8 border-t border-steel/20 pt-10">
          <PlaqueLogo largeur="clamp(150px, 20vw, 190px)" />
          <p className="t-meta text-[0.8125rem] text-steel">
            Accompagnement business en 8 étapes, en français.
          </p>
        </div>
      </div>
    </footer>
  );
}
