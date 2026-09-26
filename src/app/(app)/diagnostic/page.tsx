"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PremiumCard } from "@/components/app-ui/PremiumCard";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, ArrowRight, RotateCcw, Play, FileText } from "lucide-react";

export default function DiagnosticPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [existingResult, setExistingResult] = useState<{ score: number; priorities: string[] } | null>(null);
  const [missionStatus, setMissionStatus] = useState<string | null>(null);
  const [missionProgressId, setMissionProgressId] = useState<string | null>(null);
  // Identifiant réel de la mission 1.1 (uuid), retrouvé par son code
  const [mission11Id, setMission11Id] = useState<string | null>(null);

  useEffect(() => {
    async function checkExisting() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setChecking(false);
        return;
      }

      const { data } = await supabase
        .from("diagnostics")
        .select("score, priorities")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setExistingResult({
          score: data.score as number,
          priorities: (data.priorities as string[]) ?? [],
        });
      }

      // Check mission progress for stage 1
      const { data: stagesData } = await supabase
        .from("stages")
        .select("id")
        .eq("number", 1)
        .limit(1)
        .maybeSingle();

      if (stagesData?.id) {
        const { data: missionsData } = await supabase
          .from("missions")
          .select("id")
          .eq("stage_id", stagesData.id)
          .eq("code", "1.1")
          .limit(1)
          .maybeSingle();

        if (missionsData?.id) {
          setMission11Id(missionsData.id as string);
          const { data: progress } = await supabase
            .from("mission_progress")
            .select("id, status")
            .eq("profile_id", user.id)
            .eq("mission_id", missionsData.id)
            .maybeSingle();

          if (progress) {
            setMissionProgressId(progress.id as string);
            setMissionStatus(progress.status as string);
          }
        }
      }

      setChecking(false);
    }
    checkExisting();
  }, []);

  async function retakeDiagnostic() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("diagnostics").delete().eq("profile_id", user.id);
    setExistingResult(null);
    setMissionProgressId(null);
    setMissionStatus(null);
  }

  if (checking) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          <p className="text-sm text-secondary">Chargement...</p>
        </div>
      </div>
    );
  }

  if (existingResult) {
    const scoreColor =
      existingResult.score >= 70 ? "text-success" : existingResult.score >= 40 ? "text-ochre" : "text-error";

    return (
      <div className="mx-auto max-w-xl px-6 py-10">
        <PremiumCard glow className="text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-ochre">
            Votre Funnel Score
          </p>
          <p className={`my-4 t-chiffre text-7xl leading-none ${scoreColor}`}>
            {existingResult.score}<span className="t-meta text-2xl text-secondary">/100</span>
          </p>
          <div className="my-6 h-2 w-full overflow-hidden rounded-full bg-dark/8">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                existingResult.score >= 70 ? "bg-success" : existingResult.score >= 40 ? "bg-ochre" : "bg-error"
              }`}
              style={{ width: `${existingResult.score}%` }}
            />
          </div>

          <PremiumCard title="Vos 3 priorités" className="mt-6 text-left">
            <ol className="space-y-2 pl-1 text-dark">
              {existingResult.priorities.map((priority, i) => (
                <li key={i} className="flex items-start gap-2 text-[0.9375rem]">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/20 text-[0.625rem] font-bold text-ochre">
                    {i + 1}
                  </span>
                  {priority}
                </li>
              ))}
            </ol>
          </PremiumCard>

          {/* CTA selon le statut de la mission */}
          <div className="mt-6 flex flex-col gap-3">
            {missionStatus === "valide" ? (
              <>
                <Button
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => router.push("/parcours/offre")}
                >
                  <Play className="h-4 w-4" />
                  Passer à l&apos;étape 2 — Construire mon offre
                </Button>
                <p className="text-center text-xs text-success font-medium">
                  ✅ Étape 1 terminée ! Votre diagnostic a été validé.
                </p>
              </>
            ) : missionStatus === "soumis" ? (
              <>
                <Button
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => router.push(mission11Id ? `/missions/${mission11Id}` : "/parcours/diagnostic")}
                >
                  <FileText className="h-4 w-4" />
                  Voir mon livrable soumis
                </Button>
                <p className="text-center text-xs text-ochre">
                  ⏳ En attente du retour de votre coach.
                </p>
              </>
            ) : missionStatus === "a_corriger" ? (
              <>
                <Button
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => router.push(mission11Id ? `/missions/${mission11Id}` : "/parcours/diagnostic")}
                >
                  <RotateCcw className="h-4 w-4" />
                  Corriger mon diagnostic
                </Button>
                <p className="text-center text-xs text-error">
                  Votre coach a demandé des modifications.
                </p>
              </>
            ) : (
              <>
                <Button
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => router.push(mission11Id ? `/missions/${mission11Id}` : "/parcours/diagnostic")}
                >
                  <Play className="h-4 w-4" />
                  Commencer mon diagnostic
                </Button>
                <p className="text-center text-xs text-secondary">
                  Répondez aux questions de la mission pour obtenir votre Funnel Score.
                </p>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={retakeDiagnostic}
            className="mt-4 flex items-center justify-center gap-2 w-full text-sm text-steel/60 hover:text-ochre transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Refaire le diagnostic
          </button>
        </PremiumCard>
      </div>
    );
  }

  // No existing result — show CTA to start
  return (
    <div className="mx-auto max-w-xl px-6 py-20">
      <PremiumCard glow className="text-center">
        <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-gold" />
        <h1 className="t-display-mid text-2xl text-dark">Votre diagnostic vous attend</h1>
        <p className="mt-3 text-secondary">
          Répondez à 13 questions pour obtenir votre Funnel Score et identifier vos 3 priorités.
          Cela prend environ 20 minutes.
        </p>
        <Button
          className="mt-6 w-full flex items-center justify-center gap-2"
          onClick={() => router.push(mission11Id ? `/missions/${mission11Id}` : "/parcours/diagnostic")}
        >
          <Play className="h-4 w-4" />
          Faire mon état des lieux
        </Button>
      </PremiumCard>
    </div>
  );
}
