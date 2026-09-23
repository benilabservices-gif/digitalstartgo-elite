"use client";

import { useEffect, useRef, useState } from "react";
import { Section } from "./Section";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CheckCircle2 } from "lucide-react";

const ETAPES = [
  "Diagnostic",
  "Offre",
  "Cible & Positionnement",
  "Lead Magnet",
  "Acquisition",
  "Mon Funnel",
  "Conversion & Relance",
  "Mesure & Optimisation",
];

export function ApercuPlateforme() {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [hovered, setHovered] = useState(false);

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
    <Section tone="navy" haut={940} bas={900} intensite={0.4}>
      <h2 className="t-display max-w-[17ch] text-[clamp(2.1rem,5.4vw,3.9rem)] text-paper">
        Votre premier jour ressemble à ça.
      </h2>
      <p className="mt-6 max-w-[50ch] text-[1.1875rem] text-steel">
        Pas une bibliothèque de vidéos : une seule mission ouverte, et sept étapes qui attendent leur tour.
      </p>

      <div
        ref={ref}
        className={`relative mt-14 w-full transition-all duration-700 ${
          revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        } lg:-mx-16 lg:w-[calc(100%+8rem)]`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          transform: hovered && revealed ? "perspective(1000px) rotateX(1deg)" : "none",
          transition: "transform 0.4s ease",
        }}
      >
        <div className="rounded-[2px] border border-paper/10 bg-white/95 backdrop-blur-sm shadow-[0_24px_64px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between border-b border-dark/8 px-6 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-error/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-gold/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
              </div>
              <p className="t-display-mid text-[0.875rem] text-dark">Mon Parcours Virtuose</p>
            </div>
            <p className="t-meta text-[0.75rem] text-secondary">Jour 1</p>
          </div>

          <div className="px-6 py-6">
            <ProgressBar value={0} label="Progression globale" />

            <div className="mt-7 rounded-[2px] border-l-[3px] border-gold bg-ink/3 py-4 pl-5 pr-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="t-display-mid text-[1rem] text-dark">Réaliser mon diagnostic funnel</p>
                <Badge tone="default">À faire</Badge>
              </div>
              <p className="mt-1.5 text-[0.875rem] text-secondary">
                Mission 1 sur 3, étape Diagnostic. 12 minutes.
              </p>
            </div>

            <ul className="mt-7">
              {ETAPES.map((etape, index) => (
                <li
                  key={etape}
                  className={`flex items-center gap-4 border-t border-dark/6 py-3 first:border-t-0 transition-colors hover:bg-paper/50 rounded px-2 -mx-2 ${
                    index === 0 ? "bg-paper/60" : ""
                  }`}
                >
                  <span className={`t-chiffre w-7 shrink-0 text-[0.8125rem] ${index === 0 ? "text-gold" : "text-secondary"}`}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className={`flex-1 text-[0.9375rem] ${index === 0 ? "text-dark font-semibold" : "text-secondary"}`}>
                    {etape}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`h-[3px] w-12 shrink-0 sm:w-20 rounded-full ${
                      index === 0 ? "bg-gold animate-pulse" : "bg-dark/10"
                    }`}
                  />
                  {index === 0 && <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
}
