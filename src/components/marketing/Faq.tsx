"use client";

import { useState } from "react";
import { Section } from "./Section";

const QUESTIONS = [
  {
    question: "Combien de temps dure le programme ?",
    reponse: "Le parcours en 8 étapes se termine généralement en 8 à 12 semaines, à votre rythme.",
  },
  {
    question: "Ai-je besoin d'une audience pour commencer ?",
    reponse:
      "Non. Le programme vous aide à construire votre audience en même temps que votre offre.",
  },
  {
    question: "Comment fonctionne le coaching ?",
    reponse:
      "Vous soumettez un livrable par mission, votre coach le corrige, vous ajustez si besoin.",
  },
  {
    question: "Puis-je annuler ?",
    reponse: "Oui, à tout moment, sans engagement de durée.",
  },
  {
    question: "Le programme convient-il aux débutants ?",
    reponse: "Oui. Chaque mission part du principe que vous n'avez encore rien construit.",
  },
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <Section tone="light" id="faq" haut={700} bas={700} intensite={1}>
      <h2 className="t-display max-w-[13ch] text-[clamp(2.1rem,5.4vw,3.9rem)] text-dark">
        Ce qu&apos;on nous demande avant de s&apos;inscrire.
      </h2>

      <div className="mt-14">
        {QUESTIONS.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={item.question} className="border-t border-dark/12 last:border-b">
              <h3>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  aria-controls={`reponse-${index}`}
                  id={`question-${index}`}
                  className="flex w-full items-start gap-5 py-6 text-left"
                >
                  {/* Le signe pivote : c'est une réponse à l'action, pas un décor. */}
                  <span
                    aria-hidden="true"
                    className="relative mt-[0.45em] block h-3 w-3 shrink-0"
                  >
                    <span className="absolute left-0 top-1/2 h-[2px] w-3 -translate-y-1/2 bg-ochre" />
                    <span
                      className={`absolute left-1/2 top-0 h-3 w-[2px] -translate-x-1/2 bg-ochre transition-transform duration-300 ${
                        isOpen ? "rotate-90" : ""
                      }`}
                    />
                  </span>
                  <span
                    className={`t-display-mid flex-1 transition-[font-size,color] duration-200 ${
                      isOpen
                        ? "text-[clamp(1.25rem,3vw,1.65rem)] text-dark"
                        : "text-[clamp(1.1rem,2.4vw,1.35rem)] text-dark"
                    }`}
                  >
                    {item.question}
                  </span>
                </button>
              </h3>
              {isOpen && (
                <div
                  id={`reponse-${index}`}
                  role="region"
                  aria-labelledby={`question-${index}`}
                  className="pb-7 pl-8"
                >
                  <p className="max-w-[58ch] text-[1.0625rem] text-secondary">{item.reponse}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
