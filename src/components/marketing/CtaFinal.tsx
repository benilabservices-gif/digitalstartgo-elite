import Link from "next/link";
import { Section } from "./Section";

export function CtaFinal() {
  return (
    <Section tone="dark">
      <div className="flex flex-col items-center gap-6 text-center">
        <h2 className="max-w-xl font-heading text-4xl font-semibold sm:text-6xl">
          Construisez votre système de vente. Lancez-le. Optimisez-le.
        </h2>
        <Link
          href="/signup"
          className="rounded-sm bg-ochre px-6 py-3 font-semibold text-ink transition hover:bg-amber"
        >
          Construire mon système de vente
        </Link>
      </div>
    </Section>
  );
}
