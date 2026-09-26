"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

function PasswordResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    async function init() {
      const supabase = createClient();

      // Si un token_hash est présent dans l'URL, le vérifier d'abord
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      if (tokenHash && type === "recovery") {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });
        if (verifyError) {
          setHasRecoverySession(false);
          setVerifying(false);
          return;
        }
      }

      // Sinon, vérifier s'il y a déjà une session de récupération
      const { data: { session } } = await supabase.auth.getSession();
      setHasRecoverySession(session !== null);
      setVerifying(false);
    }
    init();
  }, [searchParams]);

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

  if (verifying) {
    return (
      <Card title="Vérification en cours...">
        <p className="text-sm text-secondary">Validation du lien de réinitialisation.</p>
      </Card>
    );
  }

  if (hasRecoverySession === false) {
    return (
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
    );
  }

  return (
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
  );
}

export const dynamic = "force-dynamic";

export default function ReinitialiserMotDePassePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <Suspense fallback={
        <Card title="Chargement...">
          <p className="text-sm text-secondary">Vérification du lien...</p>
        </Card>
      }>
        <PasswordResetForm />
      </Suspense>
    </main>
  );
}
