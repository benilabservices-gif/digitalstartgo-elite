"use client";

import { useEffect, useRef, useState } from "react";
import { Section } from "./Section";
import { ExempleBadge } from "./ExempleBadge";

// Les quatre métriques ne sont pas quatre chiffres côte à côte : c'est un
// entonnoir. La section montre enfin, en dur, la forme que la page dessine
// depuis le début.
const PALIERS: Array<{
  label: string;
  valeur: number;
  largeur: number;
  suffixe: string;
  format?: "number";
}> = [
  { label: "Leads collectés", valeur: 428, largeur: 100, suffixe: "" },
  { label: "Taux de conversion", valeur: 6.2, largeur: 76, suffixe: " %" },
  { label: "Ventes conclues", valeur: 37, largeur: 52, suffixe: "" },
  {
    label: "Revenu généré",
    valeur: 1110000,
    largeur: 30,
    suffixe: " FCFA",
    format: "number",
  },
];

function formatValue(value: number, format?: "number"): string {
  if (format === "number") {
    return value.toLocaleString("fr-FR").replace(/,/g, " ");
  }
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return value.toFixed(1).replace(".", ",");
}

function AnimatedCounters() {
  const ref = useRef<HTMLOListElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3, rootMargin: "0px 0px -20px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <ol className="mt-14 flex flex-col items-center gap-3" ref={ref}>
      {PALIERS.map((palier, index) => {
        const dernier = index === PALIERS.length - 1;
        return (
          <li
            key={palier.label}
            style={{ width: `max(15rem, ${palier.largeur}%)` }}
            className={`flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-5 py-5 sm:px-7 ${
              dernier ? "bg-gold text-ink" : "border border-ochre/35 text-dark"
            }`}
          >
            <span
              className={`t-meta text-[0.875rem] ${
                dernier ? "text-ink/80" : "text-secondary"
              }`}
            >
              {palier.label}
            </span>
            <span className="t-chiffre text-[clamp(1.5rem,4vw,2.5rem)] leading-none">
              {revealed ? formatValue(palier.valeur, palier.format) : "—"}
              {palier.suffixe && (
                <span className="t-meta ml-1 text-[0.75em]">{palier.suffixe}</span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function Resultats() {
  return (
    <Section tone="light" id="resultats" haut={820} bas={780} intensite={0.68}>
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-3">
        <h2 className="t-display text-[clamp(2.1rem,5.4vw,3.9rem)] text-dark">
          Ce que vous regardez à la fin.
        </h2>
        <ExempleBadge />
      </div>
      <p className="mt-6 max-w-[52ch] text-[1.1875rem] text-secondary">
        Un tableau de bord qui se lit de haut en bas, dans l&apos;ordre où l&apos;argent circule.
        Les chiffres ci-dessous sont une illustration, pas une promesse.
      </p>

      <AnimatedCounters />
    </Section>
  );
}
