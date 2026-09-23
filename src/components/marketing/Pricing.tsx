"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Section } from "./Section";
import { PLANS, formatXof } from "@/lib/subscriptions/plans";
import { Check } from "lucide-react";

const PALIERS: Array<{
  nom: string;
  prix: string;
  periode: string;
  misEnAvant: boolean;
  avantages: string[];
}> = [
  {
    nom: PLANS.starter.name,
    prix: formatXof(PLANS.starter.amountXof),
    periode: "par mois",
    misEnAvant: false,
    avantages: ["Accès au parcours en 8 étapes", "Ressources et templates", "Communauté"],
  },
  {
    nom: PLANS.pro.name,
    prix: formatXof(PLANS.pro.amountXof),
    periode: "par mois",
    misEnAvant: true,
    avantages: ["Tout Starter", "Coaching avec feedback sur chaque mission", "Accès à Virtuose AI"],
  },
  {
    nom: PLANS.elite.name,
    prix: formatXof(PLANS.elite.amountXof),
    periode: "par mois",
    misEnAvant: false,
    avantages: ["Tout Pro", "Sessions de coaching individuelles", "Revue prioritaire des livrables"],
  },
];

export function Pricing() {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setRevealed(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Section tone="light" id="tarifs" haut={740} bas={700} intensite={0.88}>
      <h2 className="t-display max-w-[13ch] text-[clamp(2.1rem,5.4vw,3.9rem)] text-dark">
        Le col de l&apos;entonnoir.
      </h2>
      <p className="mt-6 max-w-[50ch] text-[1.1875rem] text-secondary">
        C&apos;est l&apos;endroit le plus étroit de la page, et le seul choix qu&apos;il vous reste à faire. Sans engagement de durée.
      </p>

      <div ref={ref} className="mt-14 flex flex-col gap-5">
        {PALIERS.map((palier, index) => (
          <div
            key={palier.nom}
            className={`relative rounded-[2px] transition-all duration-500 ${
              palier.misEnAvant
                ? "border-2 border-gold/50 bg-ink px-6 py-8 text-paper shadow-[0_16px_48px_rgba(10,21,49,0.25)] lg:-mx-8 lg:px-10"
                : `border border-dark/12 bg-white px-6 py-7 ${revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`
            }`}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            {palier.misEnAvant && (
              <div className="absolute -top-3 left-6 rounded-[2px] bg-gold px-3 py-1">
                <span className="t-meta text-[0.6875rem] text-ink">Le plus choisi</span>
              </div>
            )}

            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <h3 className={`t-display-mid text-[clamp(1.35rem,3vw,1.85rem)] ${palier.misEnAvant ? "text-paper" : "text-dark"}`}>
                {palier.nom}
              </h3>
              <p className="flex items-baseline gap-2">
                <span className={`t-chiffre text-[clamp(1.5rem,3.6vw,2.15rem)] ${palier.misEnAvant ? "text-gold" : "text-dark"}`}>
                  {palier.prix}
                </span>
                <span className={`text-[0.9375rem] ${palier.misEnAvant ? "text-steel" : "text-secondary"}`}>
                  {palier.periode}
                </span>
              </p>
            </div>

            <ul className="mt-5 flex flex-col gap-2 text-[1rem]">
              {palier.avantages.map((avantage) => (
                <li key={avantage} className="flex items-center gap-2.5">
                  <Check className={`h-4 w-4 shrink-0 ${palier.misEnAvant ? "text-gold" : "text-ochre"}`} />
                  <span className={palier.misEnAvant ? "text-steel" : "text-secondary"}>{avantage}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              className={`t-meta mt-7 inline-block rounded-[3px] px-6 py-3 text-[1rem] transition-all ${
                palier.misEnAvant
                  ? "bg-gold text-ink hover:bg-amber hover:shadow-[0_0_24px_rgba(240,185,40,0.4)]"
                  : "border border-dark/20 text-dark hover:border-ochre hover:text-ochre"
              }`}
            >
              Construire mon système de vente
            </Link>
          </div>
        ))}
      </div>
    </Section>
  );
}
