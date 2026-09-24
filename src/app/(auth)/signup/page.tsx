"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SigneVirtuose } from "@/components/marketing/LogoVirtuose";
import { Eye, EyeOff, Mail, Lock, Building2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      setInfo("Vérifiez votre boîte mail pour confirmer votre inscription avant de vous connecter.");
      return;
    }
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-ink">
      {/* Left panel — branding */}
      <div className="hidden w-1/2 flex-col justify-between p-12 lg:flex">
        <div className="flex items-center gap-3 text-paper">
          <SigneVirtuose className="h-10 w-10" />
          <span className="t-display-mid text-xl">Virtuose Funnel</span>
        </div>
        <div>
          <p className="mt-8 t-display text-[clamp(2rem,3vw,3.5rem)] leading-tight text-paper">
            Commencez à<br />construire votre système.
          </p>
          <p className="mt-4 text-[1.0625rem] text-steel">
            8 étapes, des missions concrètes, et un coach qui relit chaque livrable.
          </p>
        </div>
        <div className="space-y-3">
          {["Parcours guidé en 8 étapes", "Feedback personnalisé par un coach", "Accès communauté d'entrepreneurs"].map((item) => (
            <div key={item} className="flex items-center gap-2.5 text-sm text-steel">
              <svg className="h-4 w-4 shrink-0 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {item}
            </div>
          ))}
        </div>
        <p className="text-sm text-steel/50">© 2026 Virtuose Funnel</p>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden flex items-center gap-2.5">
            <SigneVirtuose className="h-8 w-8 text-paper" />
            <span className="t-display-mid text-lg text-paper">Virtuose Funnel</span>
          </div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-ochre">Inscription</p>
          <h1 className="t-display-mid text-2xl text-paper">Créer mon compte</h1>
          <p className="mt-2 text-sm text-steel">Rejoignez le programme et commencez votre parcours.</p>

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
                  minLength={6}
                  placeholder="Minimum 6 caractères"
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
              <p className="mt-1 text-xs text-steel/50">Minimum 6 caractères</p>
            </div>

            {error && <p className="rounded-[2px] bg-error/15 px-3 py-2 text-sm text-error">{error}</p>}
            {info && <p className="rounded-[2px] bg-gold/10 px-3 py-2 text-sm text-gold">{info}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-[2px] bg-gold py-2.5 text-sm font-semibold text-ink transition-all hover:bg-amber hover:shadow-[0_0_20px_rgba(240,185,40,0.3)] disabled:opacity-50"
            >
              {loading ? "Création en cours…" : "Créer mon compte"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-steel">
            Déjà un compte ?{" "}
            <Link href="/login" className="font-semibold text-gold hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
