import Link from "next/link";
import { LARGEUR_ENTONNOIR } from "./Section";
import { SigneVirtuose } from "./LogoVirtuose";

const SIGNAUX = [
  [4, 11, 0.5],
  [11, 6, 0.28],
  [17, 15, 0.7],
  [23, 4, 0.38],
  [29, 12, 0.55],
  [36, 8, 0.26],
  [42, 17, 0.46],
  [49, 5, 0.64],
  [55, 13, 0.32],
  [62, 9, 0.5],
  [68, 16, 0.4],
  [75, 7, 0.6],
  [81, 14, 0.28],
  [88, 10, 0.46],
  [95, 6, 0.35],
] as const;

const AVATAR_INITIALES = ["AK", "MN", "FD", "OT"];

export function Hero() {
  return (
    <section className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden bg-ink px-6 pb-24 pt-28 text-paper sm:pt-36">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {/* Gradient radial subtil en haut pour donner de la profondeur */}
        <div className="absolute inset-0 rayon-dore" />

        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
          {SIGNAUX.map(([x, y, o]) => (
            <line
              key={`${x}-${y}`}
              x1={x}
              y1={y}
              x2={x}
              y2={y + 2.2}
              stroke="#93A7C9"
              strokeOpacity={o}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              className="animate-apparaitre opacity-0"
              style={{ animationDelay: `${900 + x * 6}ms` }}
            />
          ))}
        </svg>

        <div className="absolute inset-0 flex justify-center">
          <svg
            viewBox={`0 0 ${LARGEUR_ENTONNOIR} 100`}
            preserveAspectRatio="none"
            className="h-full w-full max-w-[1240px] overflow-visible"
          >
            <path
              d="M -520 0 L 0 100"
              fill="none"
              stroke="#F0B928"
              strokeOpacity="0.34"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              pathLength={1}
              strokeDasharray={1}
              className="animate-tracer-paroi"
            />
            <path
              d="M 1760 0 L 1240 100"
              fill="none"
              stroke="#F0B928"
              strokeOpacity="0.34"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              pathLength={1}
              strokeDasharray={1}
              className="animate-tracer-paroi"
            />
          </svg>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[1000px]">
        {/* Signe SVG en gold directement sur le navy — plus d'immersion */}
        <div
          className="animate-monter-en-place opacity-0"
          style={{ animationDelay: "100ms" }}
        >
          <SigneVirtuose className="h-10 w-10 sm:h-12 sm:w-12" />
        </div>

        <h1
          className="t-display mt-8 animate-monter-en-place text-[clamp(2.6rem,8vw,5.75rem)] opacity-0"
          style={{ animationDelay: "220ms" }}
        >
          Transformez votre audience
          <span className="block pl-[3vw] sm:pl-16">en système de vente.</span>
        </h1>

        <p
          className="mt-8 max-w-[46ch] animate-monter-en-place pl-[3vw] text-[1.1875rem] leading-relaxed text-steel opacity-0 sm:pl-16 sm:text-[1.3125rem]"
          style={{ animationDelay: "400ms" }}
        >
          Un programme d&apos;accompagnement guidé pour construire, lancer et optimiser votre
          système d&apos;acquisition et de conversion.
        </p>

        <div
          className="mt-10 flex animate-monter-en-place flex-wrap items-center gap-x-9 gap-y-5 pl-[6vw] opacity-0 sm:pl-32"
          style={{ animationDelay: "560ms" }}
        >
          <Link
            href="/signup"
            className="t-meta rounded-[3px] bg-gold px-7 py-4 text-[1.0625rem] text-ink transition-all hover:bg-amber hover:shadow-[0_0_24px_rgba(240,185,40,0.35)]"
          >
            Construire mon système de vente
          </Link>
          <a
            href="#comment-ca-marche"
            className="t-meta border-b border-steel/60 pb-1 text-[1.0625rem] text-steel transition-colors hover:border-paper hover:text-paper"
          >
            Découvrir le programme
          </a>
        </div>

        {/* Preuve sociale : avatars + compteur */}
        <div
          className="mt-10 flex animate-monter-en-place items-center gap-3 pl-[6vw] opacity-0 sm:pl-32"
          style={{ animationDelay: "680ms" }}
        >
          <div className="flex -space-x-2">
            {AVATAR_INITIALES.map((init) => (
              <div
                key={init}
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink bg-navy text-[0.625rem] font-bold text-paper"
              >
                {init}
              </div>
            ))}
          </div>
          <p className="text-[0.8125rem] text-steel/80">
            Déjà <span className="font-semibold text-paper">+200</span> entrepreneurs accompagnés
          </p>
        </div>

        <Link
          href="/login"
          className="mt-6 inline-block animate-monter-en-place pl-[9vw] text-sm text-steel/60 opacity-0 underline-offset-4 hover:text-paper hover:underline sm:pl-48"
          style={{ animationDelay: "760ms" }}
        >
          Déjà membre ? Se connecter
        </Link>
      </div>
    </section>
  );
}
