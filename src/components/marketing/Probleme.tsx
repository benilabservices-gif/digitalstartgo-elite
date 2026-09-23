"use client";

import { useEffect, useRef, useState } from "react";
import { Section } from "./Section";
import { AlertCircle, TrendingDown, EyeOff, BarChart3 } from "lucide-react";

const FRICTIONS = [
  {
    titre: "Une offre floue",
    description:
      "Vos prospects ne comprennent pas en une phrase ce que vous vendez ni pourquoi vous.",
    icone: AlertCircle,
    filet: 100,
  },
  {
    titre: "Une audience sans funnel",
    description: "Vous publiez, mais rien ne transforme vos abonnés en prospects qualifiés.",
    icone: TrendingDown,
    filet: 68,
  },
  {
    titre: "Des prospects qui ne convertissent jamais",
    description: "Ils s'intéressent, puis disparaissent — aucune relance ne les ramène.",
    icone: EyeOff,
    filet: 40,
  },
  {
    titre: "Aucune mesure de ce qui marche",
    description: "Vous avancez à l'instinct, sans savoir quelle action a réellement un impact.",
    icone: BarChart3,
    filet: 16,
  },
];

export function Probleme() {
  const ref = useRef<HTMLDivElement>(null);
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
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Section tone="light" haut={1240} bas={1140} intensite={0.05}>
      <h2 className="t-display max-w-[16ch] text-[clamp(2.1rem,5.4vw,3.9rem)] text-dark">
        Ce n&apos;est pas un problème de trafic.
      </h2>
      <p className="mt-6 max-w-[52ch] text-[1.1875rem] text-secondary">
        C&apos;est un problème de système. Voilà ce qui se passe quand il n&apos;y en a pas : le
        signal s&apos;affaiblit à chaque étape, jusqu&apos;à ne plus rien produire.
      </p>

      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {FRICTIONS.map((friction, index) => {
          const Icone = friction.icone;
          return (
            <div
              key={friction.titre}
              ref={index === 0 ? ref : null}
              className={`group rounded-[2px] border border-dark/8 bg-white p-6 transition-all duration-500 hover:-translate-y-1 hover:border-ochre/30 hover:shadow-[0_8px_32px_rgba(10,21,49,0.08)] ${
                revealed ? "opacity-100" : "opacity-0"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[2px] bg-ink/5 text-ochre transition-colors group-hover:bg-ochre/10">
                <Icone className="h-5 w-5" />
              </div>
              <h3 className="t-display-mid text-[1.125rem] text-dark">{friction.titre}</h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-secondary">
                {friction.description}
              </p>
              <div className="mt-5 h-px bg-dark/8 transition-all group-hover:bg-ochre/40" style={{ width: `${friction.filet}%` }} />
            </div>
          );
        })}
      </div>
    </Section>
  );
}
