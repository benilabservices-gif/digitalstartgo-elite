import Link from "next/link";
import { PlaqueLogo } from "./LogoVirtuose";

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
  return (
    <footer className="bg-ink px-6 py-16 text-paper sm:px-8">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
          {/* Colonne logo + description */}
          <div>
            <PlaqueLogo largeur="clamp(140px, 16vw, 170px)" />
            <p className="mt-6 text-[0.9375rem] leading-relaxed text-steel">
              Accompagnement business en 8 étapes, en français.
            </p>
          </div>

          {/* Colonne navigation */}
          <nav aria-label="Navigation footer">
            <p className="t-meta mb-4 text-[0.8125rem] text-ochre">Navigation</p>
            <ul className="flex flex-col gap-2.5">
              {NAVIGATION.map((lien) => (
                <li key={lien.href}>
                  <a
                    href={lien.href}
                    className="text-[0.9375rem] text-steel transition-colors hover:text-paper"
                  >
                    {lien.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Colonne mentions */}
          <div>
            <p className="t-meta mb-4 text-[0.8125rem] text-ochre">Mentions</p>
            <ul className="flex flex-col gap-2.5">
              {MENTIONS.map((mention) => (
                <li key={mention.label}>
                  <Link
                    href={mention.href}
                    className="text-[0.9375rem] text-steel transition-colors hover:text-paper"
                  >
                    {mention.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-steel/20 pt-8 flex flex-wrap items-center justify-between gap-4">
          <p className="t-meta text-[0.8125rem] text-steel">
            &copy; {new Date().getFullYear()} Virtuose Funnel. Tous droits réservés.
          </p>
          <p className="t-meta text-[0.75rem] text-steel/60">
            Fait avec ambition pour les entrepreneurs qui construisent.
          </p>
        </div>
      </div>
    </footer>
  );
}
