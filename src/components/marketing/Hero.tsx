import Link from "next/link";

const PORTEE = [0, 1, 2, 3, 4];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-ink px-6 py-28 text-white sm:py-40">
      <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 opacity-[0.16]">
        {PORTEE.map((i) => (
          <div
            key={i}
            className="mx-auto h-px w-full origin-left animate-draw-line bg-ochre"
            style={{ marginTop: i === 0 ? 0 : "14px", animationDelay: `${i * 90}ms` }}
          />
        ))}
      </div>
      <div className="relative mx-auto flex max-w-4xl flex-col items-start">
        <p
          className="animate-rise-in font-heading text-xl italic text-ochre opacity-0"
          style={{ animationDelay: "150ms" }}
        >
          Virtuose Funnel
        </p>
        <h1
          className="mt-6 animate-rise-in font-heading text-5xl font-semibold leading-[1.05] opacity-0 sm:text-7xl"
          style={{ animationDelay: "260ms" }}
        >
          Transformez votre audience
          <br />
          en système de vente.
        </h1>
        <p
          className="mt-8 max-w-xl animate-rise-in text-lg text-white/70 opacity-0"
          style={{ animationDelay: "420ms" }}
        >
          Un programme d&apos;accompagnement guidé pour construire, lancer et optimiser votre
          système d&apos;acquisition et de conversion.
        </p>
        <div
          className="mt-10 flex animate-rise-in flex-wrap items-center gap-6 opacity-0"
          style={{ animationDelay: "540ms" }}
        >
          <Link
            href="/signup"
            className="rounded-sm bg-ochre px-7 py-3.5 font-semibold text-ink transition hover:bg-amber"
          >
            Construire mon système de vente
          </Link>
          <a
            href="#comment-ca-marche"
            className="border-b border-white/40 pb-0.5 font-medium text-white/80 transition hover:border-white hover:text-white"
          >
            Découvrir le programme
          </a>
        </div>
        <Link
          href="/login"
          className="mt-6 animate-rise-in text-sm text-white/50 opacity-0 hover:text-white hover:underline"
          style={{ animationDelay: "600ms" }}
        >
          Déjà un compte ? Se connecter
        </Link>
      </div>
    </section>
  );
}
