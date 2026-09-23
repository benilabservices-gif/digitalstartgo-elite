"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SigneVirtuose } from "./LogoVirtuose";

const LIENS = [
  { href: "#comment-ca-marche", id: "comment-ca-marche", label: "Le programme" },
  { href: "#les-etapes", id: "les-etapes", label: "Les 8 étapes" },
  { href: "#resultats", id: "resultats", label: "Résultats" },
  { href: "#tarifs", id: "tarifs", label: "Tarifs" },
  { href: "#faq", id: "faq", label: "FAQ" },
];

/**
 * Parti pris : la nav est présente dès le premier pixel.
 * En haut de page elle est transparente et fait partie du Hero (fond encre) ;
 * passé le seuil elle prend son fond opaque. Le filet or sous la barre
 * n'est pas un décor : c'est la progression de lecture — ce qui rend inutile
 * l'ancien indicateur latéral.
 */
export function MarketingNav() {
  const [pose, setPose] = useState(false);
  const [progres, setProgres] = useState(0);
  const [actif, setActif] = useState<string | null>(null);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const brut = useRef(0);

  useEffect(() => {
    let frame = 0;
    function mesurer() {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      brut.current = total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0;
      if (!frame) {
        frame = window.requestAnimationFrame(() => {
          frame = 0;
          setProgres(brut.current);
          setPose(window.scrollY > 32);
        });
      }
    }
    window.addEventListener("scroll", mesurer, { passive: true });
    window.addEventListener("resize", mesurer);
    mesurer();
    return () => {
      window.removeEventListener("scroll", mesurer);
      window.removeEventListener("resize", mesurer);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const cibles = LIENS.map((lien) => document.getElementById(lien.id)).filter(
      (element): element is HTMLElement => element !== null
    );
    if (cibles.length === 0) return;
    const observateur = new IntersectionObserver(
      (entrees) => {
        const visible = entrees
          .filter((entree) => entree.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActif(visible.target.id);
      },
      { rootMargin: "-30% 0px -55% 0px" }
    );
    cibles.forEach((cible) => observateur.observe(cible));
    return () => observateur.disconnect();
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        pose || menuOuvert ? "bg-ink/95 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-[1240px] items-center gap-6 px-6 py-4">
        <a href="#top" className="flex shrink-0 items-center gap-2.5 text-paper">
          <SigneVirtuose className="shrink-0" />
          <span className="t-display-mid text-[1.0625rem]">Virtuose Funnel</span>
        </a>

        <nav aria-label="Sections de la page" className="ml-auto hidden items-center gap-7 lg:flex">
          {LIENS.map((lien) => {
            const estActif = actif === lien.id;
            return (
              <a
                key={lien.href}
                href={lien.href}
                aria-current={estActif ? "true" : undefined}
                className={`t-meta relative py-1 text-sm transition-colors ${
                  estActif ? "text-gold" : "text-steel hover:text-paper"
                }`}
              >
                {lien.label}
              </a>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-4 lg:ml-0">
          <Link
            href="/login"
            className="t-meta hidden text-sm text-steel transition-colors hover:text-paper sm:block"
          >
            Se connecter
          </Link>
          <Link
            href="/signup"
            className="t-meta rounded-[3px] bg-gold px-4 py-2 text-sm text-ink transition-colors hover:bg-amber"
          >
            Commencer
          </Link>
          <button
            type="button"
            onClick={() => setMenuOuvert((ouvert) => !ouvert)}
            aria-expanded={menuOuvert}
            aria-controls="menu-mobile"
            aria-label={menuOuvert ? "Fermer le menu" : "Ouvrir le menu"}
            className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] lg:hidden"
          >
            <span
              className={`h-px w-5 bg-paper transition-transform duration-200 ${
                menuOuvert ? "translate-y-[3px] rotate-45" : ""
              }`}
            />
            <span
              className={`h-px w-5 bg-paper transition-transform duration-200 ${
                menuOuvert ? "-translate-y-[3px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </div>

      <div
        id="menu-mobile"
        hidden={!menuOuvert}
        className="border-t border-steel/20 bg-ink px-6 pb-6 pt-2 lg:hidden"
      >
        <nav aria-label="Sections de la page">
          {LIENS.map((lien) => (
            <a
              key={lien.href}
              href={lien.href}
              onClick={() => setMenuOuvert(false)}
              className="t-display-mid block py-3 text-2xl text-paper"
            >
              {lien.label}
            </a>
          ))}
          <Link
            href="/login"
            className="t-meta mt-3 block text-sm text-steel"
            onClick={() => setMenuOuvert(false)}
          >
            Se connecter
          </Link>
        </nav>
      </div>

      {/* Progression de lecture : le filet reprend l'or des parois. */}
      <div
        className={`h-px w-full transition-colors duration-300 ${
          pose ? "bg-steel/20" : "bg-transparent"
        }`}
      >
        <div
          className="h-px bg-gold"
          style={{ width: `${progres * 100}%` }}
          role="progressbar"
          aria-label="Progression dans la page"
          aria-valuenow={Math.round(progres * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </header>
  );
}
