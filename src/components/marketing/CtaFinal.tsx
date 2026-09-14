import Link from "next/link";
import { Section } from "./Section";

export function CtaFinal() {
  return (
    <Section tone="dark">
      <div className="flex flex-col items-center gap-6 text-center">
        <h2 className="max-w-xl text-3xl font-extrabold sm:text-4xl">
          Construisez votre système de vente. Lancez-le. Optimisez-le.
        </h2>
        <Link
          href="/signup"
          className="rounded-lg bg-royal px-6 py-3 font-semibold text-white transition hover:bg-electric"
        >
          Construire mon système de vente
        </Link>
      </div>
    </Section>
  );
}
