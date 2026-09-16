"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (signUpError) {
      setError("Une erreur est survenue. Vérifiez votre email et votre mot de passe.");
      return;
    }
    if (!data.session) {
      setInfo(
        "Vérifiez votre boîte mail pour confirmer votre inscription avant de vous connecter."
      );
      return;
    }
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <Card title="Créer mon compte Virtuose Funnel">
        <form onSubmit={handleSubmit} className="flex w-80 flex-col gap-4">
          <input
            type="email"
            required
            placeholder="Adresse email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-dark/10 px-3 py-2"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-dark/10 px-3 py-2"
          />
          {error && <p className="text-sm text-error">{error}</p>}
          {info && <p className="text-sm text-ochre">{info}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Création en cours..." : "Créer mon compte"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-secondary">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-semibold text-ochre hover:underline">
            Se connecter
          </Link>
        </p>
      </Card>
    </main>
  );
}
