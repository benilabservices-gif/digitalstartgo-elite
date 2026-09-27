"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Section } from "./Section";
import { PLANS, formatXof, type PlanKey } from "@/lib/subscriptions/plans";
import { Check } from "lucide-react";

export function Pricing() {
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

  const planKeys = ["starter" as const, "pro" as const, "elite" as const];

  return (
    <Section tone="light" id="tarifs" haut={740} bas={700} intensite={0.88}>
      <h2 className="t-display max-w-[13ch] text-[clamp(2.1rem,5.4vw,3.9rem)] text-dark">
        Le col de l&apos;entonnoir.
      </h2>
      <p className="mt-6 max-w-[50ch] text-[1.1875rem] text-secondary">
        Un engagement de 3 mois pour construire votre système de vente.
      </p>

      <div ref={ref} className="mt-14 flex flex-col gap-5">
        {planKeys.map((key, index) => {
          const plan = PLANS[key];
          const isPro = key === "pro";
          const economy = 3 * plan.amountXof - plan.prixTroisMoisXof;
          return (
            <div
              key={plan.key}
              className={`relative rounded-[2px] transition-all duration-500 ${
                isPro
                  ? "border-2 border-gold/50 bg-ink px-6 py-8 text-paper shadow-[0_16px_48px_rgba(10,21,49,0.25)] lg:-mx-8 lg:px-10"
                  : `border border-dark/12 bg-white px-6 py-7 ${revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {isPro && (
                <div className="absolute -top-3 left-6 rounded-[2px] bg-gold px-3 py-1">
                  <span className="t-meta text-[0.6875rem] text-ink">Le plus populaire</span>
                </div>
              )}

              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <h3 className={`t-display-mid text-[clamp(1.35rem,3vw,1.85rem)] ${isPro ? "text-paper" : "text-dark"}`}>
                  {plan.name}
                </h3>
                <p className="flex items-baseline gap-2">
                  <span className={`t-chiffre text-[clamp(1.5rem,3.6vw,2.15rem)] ${isPro ? "text-gold" : "text-dark"}`}>
                    {formatXof(plan.amountXof)}
                  </span>
                  <span className={`text-[0.9375rem] ${isPro ? "text-steel" : "text-secondary"}`}>
                    FCFA / mois
                  </span>
                </p>
              </div>

              <p className={`mt-2 text-[0.9375rem] font-semibold ${isPro ? "text-gold" : "text-ochre"}`}>
                Engagement 3 mois
              </p>

              <p className={`mt-1 text-[0.875rem] ${isPro ? "text-steel" : "text-secondary"}`}>
                ou {formatXof(plan.prixTroisMoisXof)} en une fois (vous économisez {formatXof(economy)})
              </p>

              <ul className="mt-5 flex flex-col gap-2 text-[1rem]">
                {plan.avantages.map((avantage) => {
                  const isElitePremium = key === "elite" && avantage.includes("tunnel de vente premium");
                  return (
                    <li key={avantage} className="flex items-center gap-2.5">
                      <Check className={`h-4 w-4 shrink-0 ${isPro ? "text-gold" : "text-ochre"}`} />
                      <span className={isPro ? "text-steel" : isElitePremium ? "font-semibold text-dark" : "text-secondary"}>
                        {avantage}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <Link
                href="/signup"
                className={`t-meta mt-7 inline-block rounded-[3px] px-6 py-3 text-[1rem] transition-all ${
                  isPro
                    ? "bg-gold text-ink hover:bg-amber hover:shadow-[0_0_24px_rgba(240,185,40,0.4)]"
                    : "border border-dark/20 text-dark hover:border-ochre hover:text-ochre"
                }`}
              >
                Construire mon système de vente
              </Link>
            </div>
          );
        })}
      </div>

      {/* 3 mois selon votre offre */}
      <div className="mt-16">
        <h3 className="t-display-mid text-center text-[clamp(1.35rem,3vw,1.85rem)] text-dark">
          Vos 3 mois, selon votre offre
        </h3>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white px-4 py-3 text-left text-sm font-semibold text-dark border-b border-r border-dark/12">
                  Mois
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-dark border-b border-dark/12">
                  Starter
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-dark border-b border-dark/12">
                  Pro
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-dark border-b border-dark/12">
                  Elite
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="sticky left-0 z-10 bg-ink/5 px-4 py-4 font-semibold text-dark border-b border-r border-dark/12">
                  Mois 1 — Fondations
                  <span className="block text-xs font-normal text-secondary mt-0.5">Étapes 1 à 3</span>
                </td>
                <td className="px-4 py-4 border-b border-dark/12 text-sm text-secondary">
                  Vous avancez à votre rythme, corrigé sous 72 h
                </td>
                <td className="px-4 py-4 border-b border-dark/12 text-sm text-secondary">
                  Ateliers hebdo : rendre son offre irrésistible, offres corrigées en direct
                </td>
                <td className="px-4 py-4 border-b border-dark/12 text-sm text-secondary">
                  Séance 1 : diagnostic approfondi et objectif à 90 jours<br />
                  Séance 2 : validation de l&apos;offre et du prix
                </td>
              </tr>
              <tr>
                <td className="sticky left-0 z-10 bg-ink/5 px-4 py-4 font-semibold text-dark border-b border-r border-dark/12">
                  Mois 2 — Construction
                  <span className="block text-xs font-normal text-secondary mt-0.5">Étapes 4 à 6</span>
                </td>
                <td className="px-4 py-4 border-b border-dark/12 text-sm text-secondary">
                  Vous construisez votre tunnel avec les guides Systeme.io
                </td>
                <td className="px-4 py-4 border-b border-dark/12 text-sm text-secondary">
                  Ateliers Systeme.io en direct et revue de tunnels en groupe
                </td>
                <td className="px-4 py-4 border-b border-dark/12 text-sm text-secondary">
                  Tunnel premium importé<br />
                  Séance 3 : mise en ligne du tunnel écran partagé<br />
                  Séance 4 : lead magnet et plan d&apos;acquisition
                </td>
              </tr>
              <tr>
                <td className="sticky left-0 z-10 bg-ink/5 px-4 py-4 font-semibold text-dark border-b border-r border-dark/12">
                  Mois 3 — Lancement
                  <span className="block text-xs font-normal text-secondary mt-0.5">Étapes 7 et 8</span>
                </td>
                <td className="px-4 py-4 border-b border-dark/12 text-sm text-secondary">
                  Bilan de fin de parcours corrigé par votre coach
                </td>
                <td className="px-4 py-4 border-b border-dark/12 text-sm text-secondary">
                  Ateliers relance et conversion, scripts corrigés en direct<br />
                  Bilan de groupe
                </td>
                <td className="px-4 py-4 border-b border-dark/12 text-sm text-secondary">
                  Séance 5 : page de vente et script avant lancement<br />
                  Séance 6 : bilan des chiffres et plan des 90 jours suivants<br />
                  Suivi du lancement 14 jours
                </td>
              </tr>
              <tr>
                <td className="sticky left-0 z-10 bg-ink/5 px-4 py-4 font-semibold text-dark border-r border-dark/12">
                  Vous repartez avec
                </td>
                <td className="px-4 py-4 text-sm text-secondary">
                  Un système construit et validé par un coach
                </td>
                <td className="px-4 py-4 text-sm text-secondary">
                  Un système construit et testé devant d&apos;autres
                </td>
                <td className="px-4 py-4 text-sm text-secondary font-semibold text-dark">
                  Un tunnel qui tourne, lancé avec votre coach
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Section>
  );
}
