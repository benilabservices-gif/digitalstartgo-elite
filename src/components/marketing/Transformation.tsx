"use client";

import { useEffect, useRef, useState } from "react";
import { Section } from "./Section";

const AVANT = ["Vous dispersez vos efforts", "Vous devinez ce qui pourrait marcher", "Vous publiez au hasard"];
const APRES = ["Vous suivez un système structuré", "Vous exécutez des actions guidées", "Vous mesurez chaque résultat"];

const DESORDRE = [
  [12, 18, 46, 9],
  [6, 34, 38, 27],
  [22, 52, 52, 61],
  [4, 68, 41, 76],
  [18, 88, 49, 82],
  [9, 105, 44, 112],
  [25, 122, 51, 131],
  [3, 140, 39, 133],
  [16, 156, 47, 164],
  [11, 172, 43, 168],
  [21, 6, 50, 15],
] as const;

const ORDRE = [9, 25, 41, 57, 73, 89, 105, 121, 137, 153, 169] as const;

export function Transformation() {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [svgProgress, setSvgProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
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
  }, []);

  return (
    <Section tone="light" haut={1140} bas={1060} intensite={0.12}>
      <h2 className="t-display max-w-[14ch] text-[clamp(2.1rem,5.4vw,3.9rem)] text-dark">
        Le même effort, canalisé.
      </h2>

      <div className="mt-12 rounded-[2px] border border-dark/8 bg-white p-4 sm:p-6 shadow-sm">
        <svg viewBox="0 0 620 180" className="h-auto w-full" role="img" aria-label="Schéma de transformation">
          {DESORDRE.map(([x1, y1, x2, y2], i) => {
            const travel = svgProgress;
            const curX2 = x1 + (x2 - x1) * Math.min(travel * 1.5, 1);
            const curY2 = y1 + (y2 - y1) * Math.min(travel * 1.5, 1);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={travel < 0.6 ? curX2 : 248}
                y2={travel < 0.6 ? curY2 : y1 + (90 - y1) * 0.5}
                stroke="#4B5772"
                strokeOpacity={0.3 + 0.25 * (1 - travel)}
                strokeWidth="1.5"
                strokeLinecap="round"
                className="transition-all"
                style={{ transitionDuration: "600ms" }}
              />
            );
          })}

          <rect x="248" y="0" width="7" height="180" fill="#F0B928" />

          {ORDRE.map((y, i) => {
            const lineStart = 248 + 7;
            const targetX = 470 + (596 - 470) * Math.min(svgProgress * 1.2, 1);
            const curX = lineStart + (targetX - lineStart) * Math.min(svgProgress * 1.2, 1);
            return (
              <line
                key={i}
                x1={lineStart}
                y1={y}
                x2={curX}
                y2={svgProgress >= 1 ? 90 : y}
                stroke={svgProgress >= 0.8 ? "#101D38" : "#4B5772"}
                strokeOpacity={svgProgress >= 0.8 ? 0.8 : 0.4}
                strokeWidth="1.5"
                strokeLinecap="round"
                className="transition-all"
                style={{ transitionDuration: "600ms", transitionDelay: `${i * 50}ms` }}
              />
            );
          })}

          {svgProgress >= 0.9 && (
            <>
              <circle cx="601" cy="90" r="6" fill="#F0B928" className="animate-glow-pulse" />
              <circle cx="601" cy="90" r="6" fill="none" stroke="#101D38" strokeWidth="1.5" />
            </>
          )}

          <text x="120" y="175" fill="#4B5772" fontSize="11" fontFamily="var(--font-archivo), sans-serif" fontWeight="600">
            avant
          </text>
          <text x="500" y="175" fill="#7E5B0E" fontSize="11" fontFamily="var(--font-archivo), sans-serif" fontWeight="600">
            après
          </text>
        </svg>
      </div>

      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        <div>
          <p className="t-meta mb-3 text-[0.75rem] text-error">Avant</p>
          <ul className="flex flex-col gap-2.5 text-[1.0625rem] text-secondary">
            {AVANT.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-error/60" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="t-meta mb-3 text-[0.75rem] text-success">Après</p>
          <ul className="flex flex-col gap-2.5 text-[1.0625rem] text-dark">
            {APRES.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
