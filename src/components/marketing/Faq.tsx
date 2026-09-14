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
    <Section tone="light">
      <h2 className="mb-10 text-center text-3xl font-extrabold text-dark sm:text-4xl">
        Questions fréquentes
      </h2>
      <div className="mx-auto flex max-w-2xl flex-col gap-3">
        {QUESTIONS.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={item.question} className="rounded-lg border border-dark/10 bg-white">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between px-5 py-4 text-left font-semibold text-dark"
              >
                {item.question}
                <span className="ml-4 text-secondary">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && <p className="px-5 pb-4 text-secondary">{item.reponse}</p>}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
