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
  [180, 145, 215, 152],
  [20, 50, 55, 65],
  [70, 90, 105, 98],
  [120, 130, 155, 138],
  [170, 160, 205, 168],
] as const;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function Transformation() {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
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
          setRevealed(true);
          let start: number;
          function animate(now: number) {
            if (!start) start = now;
            const raw = (now - start) / 1200;
            setSvgProgress(Math.min(easeOutCubic(raw), 1));
            if (raw < 1) requestAnimationFrame(animate);
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
      <div className="mt-12 rounded-[2px] border border-dark/8 bg-white p-4 sm:p-6 shadow-sm">
        <svg viewBox="0 0 620 180" className="h-auto w-full" role="img" aria-label="Schéma de transformation">
          {/* Lignes de désordre — animation de la gauche vers la ligne centrale */}
          {DESORDRE.map(([x1, y1, x2, y2], i) => {
            const t = progress;
            const endX = 248 + (x1 - 248) * 0.3;
            const curX2 = x1 + (endX - x1) * easeOutCubic(t);
            const midY = y1 + (90 - y1) * 0.5;
            const curY2 = y1 + (midY - y1) * easeOutCubic(t);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={t < 0.9 ? curX2 : 248}
                y2={t < 0.9 ? curY2 : 90}
                stroke="#4B5772"
                strokeOpacity={0.3 + 0.25 * (1 - t)}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            );
          })}

          {/* Ligne séparatrice */}
          <rect x="248" y="0" width="7" height="180" fill="#F0B928" />

          {/* Lignes de l'après — animation de la ligne centrale vers la droite */}
          {[20, 42, 60, 80, 100, 120, 140, 155].map((y, i) => {
            const lineStart = 255;
            const targetX = 596;
            const t = progress;
            const curX = lineStart + (targetX - lineStart) * easeOutCubic(t);
            return (
              <line
                key={i}
                x1={lineStart}
                y1={y}
                x2={curX}
                y2={t >= 1 ? 90 : y}
                stroke={t >= 0.8 ? "#101D38" : "#4B5772"}
                strokeOpacity={t >= 0.8 ? 0.8 : 0.4}
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

        {/* Labels sous le schéma — alignés gauche/droite */}
        <div className="mt-3 flex justify-between px-2">
          <span className="text-xs font-semibold text-error">avant</span>
          <span className="text-xs font-semibold text-ochre">après</span>
        </div>
      </div>

      {/* Paires Avant / Après */}
      {/* Desktop : grille 2 colonnes, chaque paire sur une ligne */}
      <div className="mt-10 hidden gap-6 sm:grid sm:grid-cols-2">
        {Paires.map((pair, i) => (
          <div key={i} className="flex gap-4">
            <div className="flex-1">
              <p className="mb-1.5 text-xs font-semibold text-error">Avant</p>
              <p className="text-sm text-secondary">{pair.avant}</p>
            </div>
            <div className="flex-1">
              <p className="mb-1.5 text-xs font-semibold text-success">Après</p>
              <p className="text-sm text-dark">{pair.apres}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile : une carte par paire */}
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
