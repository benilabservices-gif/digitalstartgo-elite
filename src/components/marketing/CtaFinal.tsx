import Link from "next/link";
import { SigneVirtuose } from "./LogoVirtuose";
import { LARGEUR_ENTONNOIR } from "./Section";

export function CtaFinal() {
  return (
    <footer className="relative overflow-hidden bg-ink px-6 pb-20 pt-32 text-paper sm:pt-40">
      {/* Gradient radial subtil en haut */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 rayon-dore" />

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

        <div className="mt-14 flex flex-wrap items-center gap-x-9 gap-y-5">
          <Link
            href="/signup"
            className="group t-meta relative overflow-hidden rounded-[3px] bg-gold px-8 py-4 text-[1.0625rem] text-ink transition-all hover:bg-amber hover:shadow-[0_0_32px_rgba(240,185,40,0.4)]"
          >
            <span className="relative z-10">Construire mon système de vente</span>
          </Link>
          <Link
            href="/login"
            className="t-meta text-[1.0625rem] text-steel/80 underline-offset-4 transition-colors hover:text-paper hover:underline"
          >
            Se connecter
          </Link>
        </div>

        <div className="mt-28 flex flex-wrap items-end justify-between gap-8 border-t border-steel/15 pt-10">
          <div className="flex items-center gap-3">
            <SigneVirtuose className="h-6 w-6" />
            <span className="t-display-mid text-sm text-paper/80">Virtuose Funnel</span>
          </div>
          <p className="t-meta text-[0.75rem] text-steel/60">
            Accompagnement business en 8 étapes, en français.
          </p>
        </div>
      </div>
    </footer>
  );
}
