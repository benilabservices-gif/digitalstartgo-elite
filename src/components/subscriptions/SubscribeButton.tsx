"use client";

import { useState } from "react";
import type { PlanKey } from "@/lib/subscriptions/plans";

type Mode = "mensuel" | "une_fois";

interface SubscribeButtonProps {
  plan: PlanKey;
  mode: Mode;
  label: string;
  highlighted?: boolean;
}

// Le paiement passe par un POST vers /api/subscriptions/checkout, qui renvoie
// l'URL de la page de paiement Cartflox.
export function SubscribeButton({ plan, mode, label, highlighted = false }: SubscribeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setLoading(true);

    const response = await fetch("/api/subscriptions/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, mode }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setLoading(false);
      setError(body?.error ?? "Impossible de démarrer le paiement. Réessayez dans un instant.");
      return;
    }

    const { url } = (await response.json()) as { url: string };
    window.location.href = url;
  }

  return (
    <div className="flex-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`t-meta w-full rounded-[3px] px-6 py-3 text-center text-[1rem] transition-all disabled:opacity-60 ${
          highlighted
            ? "bg-gold text-ink hover:bg-amber hover:shadow-[0_0_24px_rgba(240,185,40,0.4)]"
            : "border border-dark/20 text-dark hover:border-ochre hover:text-ochre"
        }`}
      >
        {loading ? "Redirection vers le paiement…" : label}
      </button>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
    </div>
  );
}
