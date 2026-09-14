"use client";

import { useEffect, useState } from "react";

const NB_REPERES = 8;

export function ProgressRail() {
  const [progres, setProgres] = useState(0);

  useEffect(() => {
    function onScroll() {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = total > 0 ? window.scrollY / total : 0;
      setProgres(Math.min(1, Math.max(0, ratio)));
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const repereActif = Math.min(NB_REPERES - 1, Math.floor(progres * NB_REPERES));

  return (
    <div
      className="fixed right-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-3 rounded-full border border-ink/10 bg-paper/80 px-2 py-4 shadow-sm backdrop-blur lg:flex"
      aria-hidden="true"
    >
      {Array.from({ length: NB_REPERES }).map((_, index) => (
        <span
          key={index}
          className={`h-6 w-px transition-colors duration-300 ${
            index <= repereActif ? "bg-ochre" : "bg-dark/20"
          }`}
        />
      ))}
    </div>
  );
}
