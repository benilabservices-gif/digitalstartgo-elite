"use client";

import { useEffect, useRef, useState } from "react";
import { Section } from "./Section";
import { ExempleBadge } from "./ExempleBadge";

const TEMOIGNAGES = [
  {
    nom: "Awa",
    metier: "coach business",
    citation: "J'ai enfin un système clair au lieu de poster au hasard chaque jour.",
    initiales: "AK",
  },
  {
    nom: "Moussa",
    metier: "formateur",
    citation: "Le feedback de mon coach m'a évité des mois d'erreurs sur mon offre.",
    initiales: "MN",
  },
  {
    nom: "Fatou",
    metier: "consultante",
    citation: "Mon funnel tourne enfin sans que j'aie à tout refaire chaque semaine.",
    initiales: "FD",
  },
];

export function Temoignages() {
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
    <Section tone="light" haut={780} bas={740} intensite={0.76}>
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-3">
        <h2 className="t-display text-[clamp(2.1rem,5.4vw,3.9rem)] text-dark">
          Ce qu&apos;en disent ceux qui ont traversé.
        </h2>
        <ExempleBadge />
      </div>

      <div
        ref={ref}
        className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {TEMOIGNAGES.map((temoignage, index) => (
          <figure
            key={temoignage.nom}
            className={`rounded-[2px] border border-dark/8 bg-white p-6 transition-all duration-500 hover:border-ochre/25 hover:shadow-sm ${
              revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: `${index * 120}ms` }}
          >
            {/* Initiales avatar */}
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-[0.6875rem] font-bold text-paper">
                {temoignage.initiales}
              </div>
              <div>
                <span className="t-meta block text-[0.875rem] text-dark">{temoignage.nom}</span>
                <span className="text-[0.8125rem] text-secondary">{temoignage.metier}</span>
              </div>
            </div>

            {/* Citation */}
            <blockquote className="text-[clamp(1.125rem,2.2vw,1.4rem)] font-serif italic leading-[1.5] text-dark">
              &laquo; {temoignage.citation} &raquo;
            </blockquote>

            {/* Filet or en bas */}
            <div className="mt-5 h-px w-10 bg-gold/50" aria-hidden="true" />
          </figure>
        ))}
      </div>
    </Section>
  );
}
