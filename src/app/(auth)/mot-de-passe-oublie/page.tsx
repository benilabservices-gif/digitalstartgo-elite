"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reinitialiser-mot-de-passe`,
    });

    setLoading(false);

    if (resetError) {
      setError("Une erreur est survenue. Réessayez dans un instant.");
      return;
    }

    setInfo("Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <Card title="Mot de passe oublié">
        <form onSubmit={handleSubmit} className="flex w-80 flex-col gap-4">
          <input
            type="email"
            required
            placeholder="Adresse email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-dark/10 px-3 py-2"
          />
          {error && <p className="text-sm text-error">{error}</p>}
          {info && <p className="text-sm text-ochre">{info}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-secondary">
          <Link href="/login" className="font-semibold text-ochre hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </Card>
    </main>
  );
}
