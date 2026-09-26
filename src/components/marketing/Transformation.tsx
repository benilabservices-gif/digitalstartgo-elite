"use client";

import { useEffect, useRef, useState } from "react";
import { Section } from "./Section";

const Paires = [
  {
    avant: "Les gens demandent le prix sur WhatsApp, puis disparaissent.",
    apres: "Chaque personne intéressée reçoit une relance prête : J+1, J+3, J+5.",
  },
  {
    avant: "Vous expliquez votre offre différemment à chaque personne.",
    apres: "Une promesse en une phrase, et une page de vente en ligne sur Systeme.io.",
  },
  {
    avant: "Vous publiez quand vous avez une idée.",
    apres: "Un plan sur 2 semaines, où chaque publication amène des contacts.",
  },
  {
    avant: "Vous ne savez pas combien vous avez vendu le mois dernier.",
    apres: "5 chiffres suivis chaque semaine, comparés à votre objectif à 90 jours.",
  },
] as const;

// Lignes de désordre réparties sur toute la zone gauche (x: 10→230)
const DESORDRE = [
  [15, 20, 35, 38],
  [22, 42, 58, 47],
  [45, 60, 78, 55],
  [10, 80, 42, 95],
  [60, 100, 90, 108],
  [30, 120, 65, 125],
  [80, 140, 110, 148],
  [50, 155, 85, 160],
  [100, 30, 140, 42],
  [130, 70, 165, 80],
  [160, 110, 195, 118],
  [180, 145, 215, 168],
  [20, 50, 55, 65],
  [70, 90, 105, 98],
  [120, 130, 155, 138],
  [170, 160, 205, 168],
] as const;

// Positions finales des traits de l'après (droite)
const ORDRE_Y = [20, 42, 60, 80, 100, 120, 140, 155, 30, 70, 110, 145, 50, 90, 130, 160] as const;

export function Transformation() {
  const ref = useRef<HTMLDivElement>(null);
  const [svgProgress, setSvgProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setSvgProgress(1);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start: number;
          function animate(now: number) {
            if (!start) start = now;
            const progress = Math.min((now - start) / 1200, 1);
            setSvgProgress(progress);
            if (progress < 1) requestAnimationFrame(animate);
          }
          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  const progress = reducedMotion ? 1 : svgProgress;

  return (
    <Section tone="light" haut={1260} bas={1180} intensite={0.12}>
      <h2 className="t-display max-w-[14ch] text-[clamp(2.1rem,5.4vw,3.9rem)] text-dark">
        Le même effort, canalisé.
      </h2>

      {/* Schéma SVG animé */}
      <div ref={ref} className="mt-12 rounded-[2px] border border-dark/8 bg-white p-4 sm:p-6 shadow-sm">
        <svg viewBox="0 0 620 180" className="h-auto w-full" role="img" aria-label="Schéma de transformation">
          {/* Lignes de désordre — animation de la gauche vers x=248, y=90 */}
          {DESORDRE.map(([x1, y1, x2, y2], i) => {
            // Position finale : lignes convergent vers x=248, y=90
            const endX = 248;
            const endY = 90;
            const curX2 = x1 + (endX - x1) * progress;
            const curY2 = y1 + (endY - y1) * progress;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={curX2}
                y2={curY2}
                stroke="#4B5772"
                strokeOpacity={0.3 + 0.25 * (1 - progress)}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            );
          })}

          {/* Ligne séparatrice */}
          <rect x="248" y="0" width="7" height="180" fill="#F0B928" />

          {/* Lignes de l'après — animation de x=255 vers x=596, y=90 */}
          {ORDRE_Y.map((y, i) => {
            const lineStart = 255;
            const targetX = 596;
            const targetY = 90;
            const curX = lineStart + (targetX - lineStart) * progress;
            const curY = y + (targetY - y) * progress;
            return (
              <line
                key={i}
                x1={lineStart}
                y1={y}
                x2={curX}
                y2={curY}
                stroke={progress >= 0.8 ? "#101D38" : "#4B5772"}
                strokeOpacity={progress >= 0.8 ? 0.8 : 0.4}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            );
          })}

          {/* Point final */}
          {progress >= 0.9 && (
            <>
              <circle cx="601" cy="90" r="6" fill="#F0B928" className="animate-glow-pulse" />
              <circle cx="601" cy="90" r="6" fill="none" stroke="#101D38" strokeWidth="1.5" />
            </>
          )}
        </svg>

        {/* Labels sous le schéma */}
        <div className="mt-3 flex justify-between px-2">
          <span className="text-xs font-semibold text-error">avant</span>
          <span className="text-xs font-semibold text-ochre">après</span>
        </div>
      </div>

      {/* Desktop : en-têtes uniques + une ligne par paire */}
      <div className="mt-10 hidden sm:block">
        <div className="mb-3 grid grid-cols-2 gap-x-10">
          <p className="t-meta text-[0.75rem] text-error">Avant</p>
          <p className="t-meta text-[0.75rem] text-success">Après</p>
        </div>
        <div className="flex flex-col gap-3">
          {Paires.map((pair) => (
            <div key={pair.avant} className="grid grid-cols-2 gap-x-10">
              <div className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-error/60" />
                <p className="text-[1.0625rem] text-secondary">{pair.avant}</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                <p className="text-[1.0625rem] text-dark">{pair.apres}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile : cartes empilées */}
      <div className="mt-6 space-y-3 sm:hidden">
        {Paires.map((pair, i) => (
          <div key={i} className="rounded-[2px] border border-dark/10 bg-white p-4 shadow-sm">
            <div className="mb-3 border-l-2 border-error pl-3">
              <p className="text-xs font-semibold text-error">Avant</p>
              <p className="mt-0.5 text-sm text-secondary">{pair.avant}</p>
            </div>
            <div className="border-l-2 border-gold pl-3">
              <p className="text-xs font-semibold text-ochre">Après</p>
              <p className="mt-0.5 text-sm text-dark">{pair.apres}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
