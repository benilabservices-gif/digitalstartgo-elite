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
    reponse: "Non. Le programme vous aide à construire votre audience en même temps que votre offre.",
  },
  {
    question: "Comment fonctionne le coaching ?",
    reponse: "Vous soumettez un livrable par mission, votre coach le corrige, vous ajustez si besoin.",
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
    <Section tone="light" id="faq">
      <h2 className="mb-10 font-heading text-4xl font-semibold text-dark sm:text-6xl">
        Questions fréquentes
      </h2>
      <div className="max-w-2xl divide-y divide-dark/15 border-t border-dark/15">
        {QUESTIONS.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={item.question}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between py-4 text-left font-medium text-dark"
              >
                {item.question}
                <span className="ml-4 font-heading text-ochre">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && <p className="pb-4 text-secondary">{item.reponse}</p>}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
