import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-navy px-6 text-center text-white">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-electric">
        Virtuose Funnel
      </p>
      <h1 className="max-w-2xl text-4xl font-extrabold sm:text-5xl">
        Transformez votre audience en système de vente.
      </h1>
      <Link
        href="/signup"
        className="rounded-lg bg-royal px-6 py-3 font-semibold text-white transition hover:bg-electric"
      >
        Construire mon système de vente
      </Link>
    </main>
  );
}
