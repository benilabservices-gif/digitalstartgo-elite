"use client";

import { useEffect, useRef, useState } from "react";
import { Section } from "./Section";
import { Check } from "lucide-react";

const ETAPES_MACRO = [
  { numero: "1", titre: "Diagnostiquez", description: "Évaluez votre système actuel et obtenez votre Funnel Score." },
  { numero: "2", titre: "Construisez", description: "Avancez mission par mission, à votre rythme." },
  { numero: "3", titre: "Soumettez", description: "Recevez un retour de coach, ajustez, validez." },
  { numero: "4", titre: "Mesurez", description: "Mettez votre système en ligne et suivez vos résultats." },
];

export function CommentCaMarche() {
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
    <Section tone="light" id="comment-ca-marche" haut={1060} bas={1000} intensite={0.2}>
      <h2 className="t-display max-w-[15ch] text-[clamp(2.1rem,5.4vw,3.9rem)] text-dark">
        Quatre temps, et vous êtes en ligne.
      </h2>

      {/* Timeline verticale sur mobile, horizontale sur desktop */}
      <div className="mt-16" ref={ref}>
        {/* Ligne de connexion */}
        <div className="absolute left-6 top-12 hidden h-[calc(100%-3rem)] w-px bg-ochre/20 lg:block lg:left-1/2 lg:-translate-x-px" aria-hidden="true" />

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {ETAPES_MACRO.map((etape, index) => (
            <div
              key={etape.numero}
              className={`relative flex flex-col items-center text-center transition-all duration-500 ${
                revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
              style={{ transitionDelay: `${index * 120}ms` }}
            >
              {/* Cercle numéroté */}
              <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-2 border-ochre/40 bg-paper text-ochre transition-all duration-500 hover:border-gold hover:bg-gold hover:text-ink hover:shadow-[0_0_20px_rgba(240,185,40,0.25)]">
                <span className="t-chiffre text-xl">{etape.numero}</span>
                {revealed && index === 3 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold">
                    <Check className="h-3 w-3 text-ink" />
                  </span>
                )}
              </div>

              {/* Carte */}
              <div className="mt-5 w-full rounded-[2px] border border-dark/8 bg-white p-5 text-left transition-all hover:border-ochre/20 hover:shadow-sm">
                <h3 className="t-display-mid text-[1.125rem] text-dark">{etape.titre}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-secondary">{etape.description}</p>
              </div>

              {/* Connecteur vertical mobile */}
              {index < ETAPES_MACRO.length - 1 && (
                <div className="my-4 h-8 w-px bg-ochre/20 lg:hidden" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
