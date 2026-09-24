"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SigneVirtuose } from "@/components/marketing/LogoVirtuose";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError("Email ou mot de passe incorrect.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-ink">
      {/* Left panel — branding */}
      <div className="hidden w-1/2 flex-col justify-between p-12 lg:flex">
          <Link href="/" className="flex items-center gap-3 text-paper hover:opacity-80 transition-opacity">
            <SigneVirtuose className="h-10 w-10" />
            <span className="t-display-mid text-xl">Virtuose Funnel</span>
          </Link>
        <div>
          <p className="mt-8 t-display text-[clamp(2rem,3vw,3.5rem)] leading-tight text-paper">
            Votre système de vente,<br />construit étape par étape.
          </p>
          <p className="mt-4 text-[1.0625rem] text-steel">
            Rejoignez les entrepreneurs qui transforment leur audience en revenus.
          </p>
        </div>
        <p className="text-sm text-steel/50">© 2026 Virtuose Funnel</p>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
            <Link href="/" className="flex items-center gap-2.5 text-paper hover:opacity-80 transition-opacity">
              <SigneVirtuose className="h-8 w-8" />
              <span className="t-display-mid text-lg text-paper">Virtuose Funnel</span>
            </Link>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-ochre">Connexion</p>
          <h1 className="t-display-mid text-2xl text-paper">Bon retour parmi nous</h1>
          <p className="mt-2 text-sm text-steel">Accédez à votre espace de travail.</p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-steel">Adresse email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel/40" />
                <input
                  type="email"
                  required
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-[2px] border border-paper/15 bg-paper/5 pl-10 pr-3 py-2.5 text-paper placeholder:text-steel/30 focus:border-gold/60 focus:outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-steel">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel/40" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-[2px] border border-paper/15 bg-paper/5 pl-10 pr-10 py-2.5 text-paper placeholder:text-steel/30 focus:border-gold/60 focus:outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-steel/50 hover:text-paper"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Link href="/mot-de-passe-oublie" className="self-end text-xs text-ochre hover:underline">
              Mot de passe oublié ?
            </Link>

            {error && <p className="rounded-[2px] bg-error/15 px-3 py-2 text-sm text-error">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-[2px] bg-gold py-2.5 text-sm font-semibold text-ink transition-all hover:bg-amber hover:shadow-[0_0_20px_rgba(240,185,40,0.3)] disabled:opacity-50"
            >
              {loading ? "Connexion en cours…" : "Se connecter"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-steel">
            Pas encore inscrit ?{" "}
            <Link href="/signup" className="font-semibold text-gold hover:underline">
              Créer mon compte
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
