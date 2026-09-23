"use client";

import Link from "next/link";
import { useState } from "react";
import { SigneVirtuose } from "./LogoVirtuose";

const NAVIGATION = [
  { label: "Le programme", href: "#comment-ca-marche" },
  { label: "Les 8 étapes", href: "#les-etapes" },
  { label: "Résultats", href: "#resultats" },
  { label: "Tarifs", href: "#tarifs" },
  { label: "FAQ", href: "#faq" },
];

const MENTIONS = [
  { label: "Connexion", href: "/login" },
  { label: "Politique de confidentialité", href: "/privacy" },
  { label: "Conditions générales", href: "/terms" },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
    }
  }

  return (
    <footer className="bg-navy px-6 py-16 text-paper sm:px-8">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Logo + description */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 text-paper">
              <SigneVirtuose className="h-7 w-7" />
              <span className="t-display-mid text-[1.0625rem]">Virtuose Funnel</span>
            </div>
            <p className="mt-5 text-[0.9375rem] leading-relaxed text-steel">
              Accompagnement business en 8 étapes, en français.
            </p>
          </div>

          {/* Navigation */}
          <nav aria-label="Navigation footer">
            <p className="t-meta mb-4 text-[0.75rem] text-ochre/80">Navigation</p>
            <ul className="flex flex-col gap-2.5">
              {NAVIGATION.map((lien) => (
                <li key={lien.href}>
                  <a href={lien.href} className="text-[0.9375rem] text-steel transition-colors hover:text-paper">
                    {lien.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Mentions */}
          <div>
            <p className="t-meta mb-4 text-[0.75rem] text-ochre/80">Mentions</p>
            <ul className="flex flex-col gap-2.5">
              {MENTIONS.map((mention) => (
                <li key={mention.label}>
                  <Link href={mention.href} className="text-[0.9375rem] text-steel transition-colors hover:text-paper">
                    {mention.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <p className="t-meta mb-4 text-[0.75rem] text-ochre/80">Restez informé</p>
            <p className="mb-4 text-[0.875rem] text-steel">Recevez nos conseils chaque semaine.</p>
            {subscribed ? (
              <p className="text-[0.9375rem] text-gold">Merci ! Vous recevrez bientôt nos informations.</p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 rounded-[2px] border border-paper/20 bg-paper/5 px-3 py-2 text-[0.875rem] text-paper placeholder:text-steel/50 focus:border-gold/60 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-[2px] bg-gold px-3 py-2 text-[0.875rem] font-semibold text-ink transition-colors hover:bg-amber"
                >
                  OK
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-12 border-t border-steel/15 pt-8 flex flex-wrap items-center justify-between gap-4">
          <p className="t-meta text-[0.75rem] text-steel/60">
            &copy; {new Date().getFullYear()} Virtuose Funnel. Tous droits réservés.
          </p>
          <p className="t-meta text-[0.6875rem] text-steel/40">
            Fait avec ambition pour les entrepreneurs qui construisent.
          </p>
        </div>
      </div>
    </footer>
  );
}
