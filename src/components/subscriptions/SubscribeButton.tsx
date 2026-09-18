"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { PlanKey } from "@/lib/subscriptions/plans";

export function SubscribeButton({ plan }: { plan: PlanKey }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setLoading(true);

    const response = await fetch("/api/subscriptions/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });

    if (!response.ok) {
      setLoading(false);
      const body = (await response.json().catch(() => null)) as { error?: string; detail?: string } | null;
      setError(
        [body?.error ?? "Impossible de démarrer le paiement.", body?.detail].filter(Boolean).join(" — ")
      );
      return;
    }

    const { url } = (await response.json()) as { url: string };
    window.location.href = url;
  }

  return (
    <div>
      <Button type="button" onClick={handleClick} disabled={loading}>
        {loading ? "Redirection..." : "Choisir ce palier"}
      </Button>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
    </div>
  );
}
