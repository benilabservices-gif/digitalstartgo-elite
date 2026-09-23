"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Section } from "./Section";
import { Badge } from "@/components/ui/Badge";
import { ArrowRight } from "lucide-react";

const ETAPES = [
  { numero: 1, titre: "Diagnostic", objectif: "Évaluer l'état actuel de votre système de vente." },
  { numero: 2, titre: "Offre", objectif: "Transformer votre expertise en une offre claire et désirable." },
  { numero: 3, titre: "Cible & Positionnement", objectif: "Définir précisément qui vous servez et pourquoi vous." },
  { numero: 4, titre: "Lead Magnet", objectif: "Créer une ressource qui capture vos prospects." },
  { numero: 5, titre: "Acquisition", objectif: "Mettre en place vos canaux de trafic." },
  { numero: 6, titre: "Mon Funnel", objectif: "Construire un funnel complet de la landing page au checkout." },
  { numero: 7, titre: "Conversion & Relance", objectif: "Optimiser votre page de vente et vos séquences de relance." },
  { numero: 8, titre: "Mesure & Optimisation", objectif: "Suivre vos métriques et améliorer en continu." },
];

export function LesHuitEtapes() {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setRevealed(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Section tone="light" id="les-etapes" haut={1000} bas={940} intensite={0.3}>
      <h2 className="t-display max-w-[15ch] text-[clamp(2.1rem,5.4vw,3.9rem)] text-dark">
        Le parcours, marche par marche.
      </h2>
      <p className="mt-6 max-w-[54ch] text-[1.1875rem] text-secondary">
        Chaque étape ferme une faille du système. Le filet sous chaque ligne montre où vous en êtes rendu quand vous la validez.
      </p>

      <div className="mt-16 flex flex-col gap-3" ref={ref}>
        {ETAPES.map((etape, index) => {
          const avancement = ((index + 1) / ETAPES.length) * 100;
          return (
            <div
              key={etape.numero}
              className={`group relative rounded-[2px] border border-dark/8 bg-white px-6 py-5 transition-all duration-500 hover:border-ochre/30 hover:shadow-sm ${
                revealed ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
              }`}
              style={{ transitionDelay: `${index * 60}ms` }}
            >
              <div className="flex flex-col gap-x-6 gap-y-2 sm:flex-row sm:items-center">
                <span className="t-chiffre w-10 shrink-0 text-[1.375rem] leading-none text-ochre">
                  {String(etape.numero).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="t-display-mid text-[clamp(1.125rem,2vw,1.5rem)] text-dark group-hover:text-ochre transition-colors">
                      {etape.titre}
                    </h3>
                    {etape.numero === 1 && <Badge tone="success">Commencez ici</Badge>}
                  </div>
                  <p className="mt-1 max-w-[52ch] text-[0.9375rem] text-secondary">{etape.objectif}</p>
                  {etape.numero === 1 && (
                    <Link
                      href="/signup"
                      className="t-meta mt-3 inline-flex items-center gap-2 text-[0.875rem] text-ochre underline decoration-ochre/40 underline-offset-4 hover:decoration-ochre"
                    >
                      Faire mon diagnostic <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-4 sm:self-center">
                  <span className="t-meta text-[0.75rem] text-secondary">{Math.round(avancement)}%</span>
                  <ArrowRight className="h-4 w-4 text-dark/20 transition-colors group-hover:text-ochre" />
                </div>
              </div>
              <div className="mt-4 h-[2px] w-full bg-dark/6">
                <div
                  className="h-full bg-gradient-to-r from-gold to-amber transition-all duration-700 ease-out"
                  style={{ width: revealed ? `${avancement}%` : "0%" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
