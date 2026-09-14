"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const LIENS = [
  { href: "#comment-ca-marche", label: "Le programme" },
  { href: "#tarifs", label: "Tarifs" },
  { href: "#faq", label: "FAQ" },
];

export function MarketingNav() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > window.innerHeight * 0.6);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-ink/90 backdrop-blur transition-transform duration-300 ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <a href="#top" className="font-heading text-lg italic text-ochre">
          Virtuose Funnel
        </a>
        <div className="hidden items-center gap-6 sm:flex">
          {LIENS.map((lien) => (
            <a
              key={lien.href}
              href={lien.href}
              className="text-sm text-white/70 transition hover:text-white"
            >
              {lien.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-white/70 hover:text-white">
            Se connecter
          </Link>
          <Link
            href="/signup"
            className="rounded-sm bg-ochre px-4 py-1.5 text-sm font-semibold text-ink transition hover:bg-amber"
          >
            Commencer
          </Link>
        </div>
      </div>
    </nav>
  );
}
