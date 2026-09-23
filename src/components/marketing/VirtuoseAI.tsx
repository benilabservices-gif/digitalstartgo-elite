"use client";

import { useEffect, useRef, useState } from "react";
import { Section } from "./Section";
import { Bot } from "lucide-react";

const PROMPTS = [
  { texte: "Analyse mon offre", taille: "clamp(1.05rem,2vw,1.35rem)", couleur: "text-steel" },
  { texte: "Donne-moi 10 hooks", taille: "clamp(1.2rem,2.5vw,1.65rem)", couleur: "text-steel" },
  { texte: "Pourquoi mon funnel ne convertit pas ?", taille: "clamp(1.4rem,3vw,2rem)", couleur: "text-paper" },
  { texte: "Écris ma séquence email", taille: "clamp(1.6rem,3.6vw,2.5rem)", couleur: "text-paper" },
];

export function VirtuoseAI() {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setRevealed(true); observer.disconnect(); } },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Section tone="navy" haut={860} bas={820} intensite={0.6}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[2px] bg-gold/15">
          <Bot className="h-5 w-5 text-gold" />
        </div>
        <h2 className="t-display text-[clamp(2.1rem,5.4vw,3.9rem)] text-paper">
          Et entre deux retours de coach, Virtuose AI.
        </h2>
      </div>
      <p className="mt-6 max-w-[50ch] text-[1.1875rem] text-steel">
        Il connaît votre offre, votre cible et l&apos;étape où vous en êtes. Vous n&apos;avez pas à lui réexpliquer votre activité à chaque fois.
      </p>

      <div
        ref={ref}
        className="mt-14 space-y-4 rounded-[2px] border border-paper/10 bg-white/5 p-6 backdrop-blur-sm"
      >
        {PROMPTS.map((prompt, index) => (
          <div
            key={prompt.texte}
            className={`flex items-baseline gap-3 transition-all duration-500 ${
              revealed ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3"
            }`}
            style={{ transitionDelay: `${index * 150}ms` }}
          >
            <span className="t-meta shrink-0 text-[0.75rem] text-ochre/70">#{index + 1}</span>
            <p
              className={`t-display-mid flex-1 ${prompt.couleur}`}
              style={{ fontSize: prompt.taille }}
            >
              {prompt.texte}
              {index === PROMPTS.length - 1 && revealed && (
                <span
                  aria-hidden="true"
                  className="ml-1.5 inline-block h-[0.95em] w-[3px] translate-y-[0.12em] animate-curseur bg-gold align-baseline"
                />
              )}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-10 flex items-center gap-2 text-[0.9375rem] italic text-steel/70">
        <span className="flex h-2 w-2 rounded-full bg-gold/60 animate-pulse" />
        Virtuose AI arrive dans le programme. Les abonnés Pro et Elite y auront accès en premier.
      </p>
    </Section>
  );
}
