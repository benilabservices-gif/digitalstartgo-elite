"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function ReinitialiserMotDePassePage() {
  const router = useRouter();
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasRecoverySession(session !== null);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (updateError) {
      setError("Le mot de passe n'a pas pu être mis à jour. Réessayez.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (hasRecoverySession === false) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-4">
        <Card title="Lien invalide ou expiré">
          <p className="w-80 text-sm text-secondary">
            Ce lien de réinitialisation n&apos;est plus valide. Demandez-en un nouveau.
          </p>
          <p className="mt-4 text-center text-sm text-secondary">
            <Link href="/mot-de-passe-oublie" className="font-semibold text-ochre hover:underline">
              Demander un nouveau lien
            </Link>
          </p>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <Card title="Choisir un nouveau mot de passe">
        <form onSubmit={handleSubmit} className="flex w-80 flex-col gap-4">
          <input
            type="password"
            required
            minLength={6}
            placeholder="Nouveau mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-dark/10 px-3 py-2"
          />
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" disabled={loading || hasRecoverySession === null}>
            {loading ? "Mise à jour..." : "Mettre à jour mon mot de passe"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
