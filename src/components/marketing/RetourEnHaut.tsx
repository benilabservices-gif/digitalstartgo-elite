"use client";

import { useEffect, useState } from "react";

/**
 * Remonter à la bouche de l'entonnoir. Le bouton n'existe pas tant qu'on n'a
 * pas quitté le Hero. La flèche reprend celle du logo : elle remonte hors du
 * col, ce n'est pas un chevron générique.
 */
export function RetourEnHaut() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    function mesurer() {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        setVisible(window.scrollY > window.innerHeight * 0.9);
      });
    }
    window.addEventListener("scroll", mesurer, { passive: true });
    mesurer();
    return () => {
      window.removeEventListener("scroll", mesurer);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  function remonter() {
    const doux = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: doux ? "smooth" : "auto" });
    document.getElementById("top")?.focus?.();
  }

  return (
    <button
      type="button"
      onClick={remonter}
      aria-label="Revenir en haut de la page"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={`fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-[3px] bg-gold text-ink shadow-[0_2px_14px_rgba(10,21,49,0.35)] transition-all duration-300 hover:bg-amber ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <svg width="18" height="20" viewBox="0 0 18 20" aria-hidden="true" focusable="false">
        {/* Les trois barres du col, puis la flèche qui en sort. */}
        <path d="M3 18.6 H15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
        <path d="M5 15.2 H13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
        <path
          d="M9 12.4 V2.2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="square"
          fill="none"
        />
        <path d="M9 1 L14 6.6 H4 Z" fill="currentColor" />
      </svg>
    </button>
  );
}
