"use client";

import { useEffect, useRef, useState } from "react";
import { Section } from "./Section";

const QUESTIONS = [
  { question: "Combien de temps dure le programme ?", reponse: "Le parcours en 8 étapes se termine généralement en 8 à 12 semaines, à votre rythme." },
  { question: "Ai-je besoin d'une audience pour commencer ?", reponse: "Non. Le programme vous aide à construire votre audience en même temps que votre offre." },
  { question: "Comment fonctionne le coaching ?", reponse: "Vous soumettez un livrable par mission, votre coach le corrige, vous ajustez si besoin." },
  { question: "Puis-je annuler ?", reponse: "Oui, à tout moment, sans engagement de durée." },
  { question: "Le programme convient-il aux débutants ?", reponse: "Oui. Chaque mission part du principe que vous n'avez encore rien construit." },
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
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
    <Section tone="light" id="faq" haut={700} bas={700} intensite={1}>
      <h2 className="t-display max-w-[13ch] text-[clamp(2.1rem,5.4vw,3.9rem)] text-dark">
        Ce qu&apos;on nous demande avant de s&apos;inscrire.
      </h2>

      <div ref={ref} className={`mt-14 space-y-3 ${revealed ? "opacity-100" : "opacity-0"} transition-opacity duration-500`}>
        {QUESTIONS.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={item.question}
              className={`rounded-[2px] border border-dark/8 bg-white transition-all duration-300 ${isOpen ? "border-ochre/30 shadow-sm" : ""}`}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
                aria-controls={`reponse-${index}`}
                id={`question-${index}`}
                className="flex w-full items-start gap-4 px-6 py-5 text-left"
              >
                <span
                  aria-hidden="true"
                  className={`mt-[0.35em] flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    isOpen ? "border-gold bg-gold/10" : "border-ochre/40"
                  }`}
                >
                  <span
                    className={`block h-[2px] w-3 bg-ochre transition-all duration-300 ${isOpen ? "opacity-0" : "opacity-100"}`}
                  />
                  <span
                    className={`absolute left-1/2 top-1/2 h-[2px] w-3 -translate-x-1/2 -translate-y-1/2 bg-ochre transition-transform duration-300 ${
                      isOpen ? "rotate-90" : ""
                    }`}
                    aria-hidden="true"
                  />
                </span>
                <span
                  className={`t-display-mid flex-1 transition-[font-size,color] duration-200 ${
                    isOpen
                      ? "text-[clamp(1.125rem,2.4vw,1.5rem)] text-dark"
                      : "text-[clamp(1rem,2vw,1.25rem)] text-dark"
                  }`}
                >
                  {item.question}
                </span>
              </button>
              {isOpen && (
                <div
                  id={`reponse-${index}`}
                  role="region"
                  aria-labelledby={`question-${index}`}
                  className="border-t border-dark/6 px-6 pb-5 pl-14"
                >
                  <p className="pt-4 text-[1rem] leading-relaxed text-secondary">{item.reponse}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
