"use client";

import { useEffect, useRef, useState } from "react";
import { Section } from "./Section";
import { ExempleBadge } from "./ExempleBadge";

const PALIERS = [
  { label: "Leads collectés", valeur: 428, largeur: 100, suffixe: "", format: "number" as const },
  { label: "Taux de conversion", valeur: 6.2, largeur: 76, suffixe: " %", format: undefined },
  { label: "Ventes conclues", valeur: 37, largeur: 52, suffixe: "", format: undefined },
  { label: "Revenu généré", valeur: 1110000, largeur: 30, suffixe: " FCFA", format: "number" as const },
];

function formatValue(value: number, format?: "number"): string {
  if (format === "number") {
    return value.toLocaleString("fr-FR").replace(/,/g, " ");
  }
  if (Number.isInteger(value)) return value.toString();
  return value.toFixed(1).replace(".", ",");
}

type Palier = typeof PALIERS[0];

function AnimatedCounters() {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setRevealed(true); observer.disconnect(); } },
      { threshold: 0.3, rootMargin: "0px 0px -20px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="mt-14 space-y-3">
      {PALIERS.map((palier, index) => {
        const dernier = index === PALIERS.length - 1;
        return (
          <div
            key={palier.label}
            className={`rounded-[2px] px-5 py-5 sm:px-7 transition-all duration-500 ${
              dernier
                ? "bg-gold text-ink shadow-[0_8px_32px_rgba(240,185,40,0.25)]"
                : "border border-ochre/30 text-dark bg-white"
            }`}
            style={{
              width: `max(15rem, ${palier.largeur}%)`,
              transitionDelay: `${index * 100}ms`,
              opacity: revealed ? 1 : 0,
              transform: revealed ? "translateX(0)" : "translateX(-12px)",
            }}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <span className={`t-meta text-[0.875rem] ${dernier ? "text-ink/70" : "text-secondary"}`}>
                {palier.label}
              </span>
              <span className="t-chiffre text-[clamp(1.5rem,4vw,2.5rem)] leading-none">
                {revealed ? formatValue(palier.valeur, palier.format) : "—"}
                {palier.suffixe && (
                  <span className={`t-meta ml-1 text-[0.75em] ${dernier ? "text-ink/70" : "text-secondary"}`}>
                    {palier.suffixe}
                  </span>
                )}
              </span>
            </div>
            {/* Barre visuelle de l'entonnoir */}
            <div className={`mt-3 h-[3px] w-full rounded-full ${dernier ? "bg-ink/15" : "bg-dark/8"}`}>
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${dernier ? "bg-ink/30" : "bg-gold"}`}
                style={{ width: revealed ? `${palier.largeur}%` : "0%" }}
              />
            </div>
          </div>
        );
      })}
    </div>
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
