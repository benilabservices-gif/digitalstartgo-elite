import Link from "next/link";

const NUMEROS_ETAPES = [1, 2, 3, 4, 5, 6, 7, 8];

export function Hero() {
  return (
    <section className="bg-navy px-6 py-20 text-white sm:py-28">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-12 text-center sm:flex-row sm:text-left">
        <div className="flex flex-1 flex-col items-center gap-6 sm:items-start">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-electric">
            Virtuose Funnel
          </p>
          <h1 className="max-w-xl text-4xl font-extrabold sm:text-5xl">
            Transformez votre audience en système de vente.
          </h1>
          <p className="max-w-xl text-white/70">
            Un programme d&apos;accompagnement guidé pour construire, lancer et optimiser votre
            système d&apos;acquisition et de conversion.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-lg bg-royal px-6 py-3 font-semibold text-white transition hover:bg-electric"
            >
              Construire mon système de vente
            </Link>
            <a
              href="#comment-ca-marche"
              className="rounded-lg px-6 py-3 font-semibold text-white/80 transition hover:text-white"
            >
              Découvrir le programme
            </a>
          </div>
          <Link href="/login" className="text-sm text-white/70 hover:text-white hover:underline">
            Déjà un compte ? Se connecter
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center gap-2">
          {NUMEROS_ETAPES.map((numero) => (
            <div
              key={numero}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-royal to-electric text-xs font-bold text-white"
            >
              {numero}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
