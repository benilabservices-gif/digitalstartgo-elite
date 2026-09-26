"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PremiumCard } from "@/components/app-ui/PremiumCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  fetchMission,
  fetchMissionByCode,
  fetchLastValidatedSubmission,
  replacePromptVariables,
} from "@/lib/missions/guided/fetch";
import type { MissionData, MissionChamp } from "@/lib/missions/guided/types";
import { formatContenu } from "@/lib/missions/guided/types";
import {
  ArrowLeft,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Copy,
  FileText,
  Play,
} from "lucide-react";

function ChampInput({
  champ,
  value,
  onChange,
}: {
  champ: MissionChamp;
  value: string | string[];
  onChange: (val: string | string[]) => void;
}) {
  const baseClass =
    "w-full rounded-[2px] border border-dark/10 bg-paper px-3 py-2 text-sm text-dark placeholder:text-secondary/40 focus:border-gold/60 focus:outline-none";

  if (champ.type === "texte_long") {
    return (
      <textarea
        className={baseClass}
        rows={champ.max_lignes ?? 4}
        value={Array.isArray(value) ? value.join("\n") : (value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        placeholder={champ.aide ? champ.aide : undefined}
      />
    );
  }

  if (champ.type === "liste") {
    const lines = Array.isArray(value) ? value : value ? [value] : [];
    return (
      <div className="flex flex-col gap-2">
        {lines.map((line, i) => (
          <div key={i} className="flex gap-2">
            <input
              className={`${baseClass} flex-1`}
              value={line}
              onChange={(e) => {
                const next = [...lines];
                next[i] = e.target.value;
                onChange(next);
              }}
            />
            <button
              type="button"
              onClick={() => onChange(lines.filter((_, j) => j !== i))}
              className="shrink-0 rounded-[2px] border border-dark/10 px-2 text-secondary hover:border-error/40 hover:text-error"
              aria-label="Supprimer cette ligne"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        ))}
        {lines.length !== (champ.max_lignes ?? 999) && (
          <button
            type="button"
            onClick={() => onChange([...lines, ""])}
            className="text-xs text-ochre hover:underline"
          >
            + Ajouter une ligne
          </button>
        )}
      </div>
    );
  }

  if (champ.type === "choix" && champ.options) {
    return (
      <div className="flex flex-col gap-2">
        {champ.options.map((opt) => (
          <label
            key={opt}
            className={`flex cursor-pointer items-center gap-3 rounded-[2px] border px-3 py-2.5 transition-colors ${
              value === opt
                ? "border-gold/60 bg-gold/10"
                : "border-dark/10 hover:border-gold/30"
            }`}
          >
            <input
              type="radio"
              name={`champ-${champ.cle}-${Date.now()}`}
              className="accent-gold"
              checked={value === opt}
              onChange={() => onChange(opt)}
            />
            <span className="text-sm text-dark">{opt}</span>
          </label>
        ))}
      </div>
    );
  }

  return (
    <input
      type={champ.type === "nombre" ? "number" : champ.type === "lien" ? "url" : "text"}
      className={baseClass}
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={champ.aide ? champ.aide : undefined}
    />
  );
}

export default function MissionPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [mission, setMission] = useState<MissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [progressId, setProgressId] = useState<string | null>(null);
  const [missionStatus, setMissionStatus] = useState<string | null>(null);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (!u) {
        router.push("/login");
        return;
      }
      setUser(u);

      // Chercher la mission par code ou par id
      const m = await fetchMissionByCode(params.id);
      if (!m) {
        const fallback = await fetchMission(params.id);
        if (!fallback) {
          setError("Mission introuvable");
          setLoading(false);
          return;
        }
        setMission(fallback);
      } else {
        setMission(m);
      }

      // Récupérer la progression
      const { data: prog } = await supabase
        .from("mission_progress")
        .select("id, status")
        .eq("mission_id", m?.id ?? params.id)
        .eq("profile_id", u.id)
        .maybeSingle();

      if (prog) {
        setProgressId(prog.id);
        setMissionStatus(prog.status);

        // Récupérer le dernier feedback si renvoyé
        const { data: subs } = await supabase
          .from("mission_submissions")
          .select("feedback_coach")
          .eq("mission_progress_id", prog.id)
          .order("created_at", { ascending: false })
          .limit(1);
        if (subs?.[0]?.feedback_coach) {
          setLastFeedback(subs[0].feedback_coach);
        }
      }

      setLoading(false);
    }
    init();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          <p className="text-sm text-secondary">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!mission || error) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-secondary/30" />
        <h1 className="t-display-mid text-xl text-dark">Mission introuvable</h1>
        <Link href="/dashboard" className="mt-4 text-sm text-ochre hover:underline">
          ← Retour au dashboard
        </Link>
      </div>
    );
  }

  return (
    <MissionContent
      mission={mission}
      progressId={progressId}
      missionStatus={missionStatus}
      lastFeedback={lastFeedback}
      user={user}
      submitted={submitted}
      onSubmitted={() => setSubmitted(true)}
    />
  );
}

function MissionContent({
  mission,
  progressId,
  missionStatus,
  lastFeedback,
  user,
  submitted,
  onSubmitted,
}: {
  mission: MissionData;
  progressId: string | null;
  missionStatus: string | null;
  lastFeedback: string | null;
  user: any;
  submitted: boolean;
  onSubmitted: () => void;
}) {
  const router = useRouter();
  const [reponses, setReponses] = useState<Record<string, string | string[]>>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [computedScore, setComputedScore] = useState<number | null>(null);

  // Pré-remplir depuis localStorage ou soumission précédente
  useEffect(() => {
    const key = `mission_draft_${mission.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setReponses(JSON.parse(saved));
        return;
      } catch {}
    }

    // Charger depuis la dernière soumission validée
    fetchLastValidatedSubmission(mission.id, user.id).then((sub) => {
      if (sub?.reponses) {
        setReponses(sub.reponses as Record<string, string | string[]>);
      }
    });
  }, [mission.id, user.id]);

  // Sauvegarder le brouillon
  useEffect(() => {
    const key = `mission_draft_${mission.id}`;
    localStorage.setItem(key, JSON.stringify(reponses));
  }, [reponses, mission.id]);

  function setChamp(cle: string, val: string | string[]) {
    setReponses((prev) => ({ ...prev, [cle]: val }));
  }

  function validate(): string | null {
    if (!mission.champs || mission.champs.length === 0) return null;
    for (const champ of mission.champs) {
      if (!champ.obligatoire) continue;
      const v = reponses[champ.cle];
      if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) {
        return champ.libelle;
      }
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const missing = validate();
    if (missing) {
      setSubmitError(`Veuillez remplir : ${missing}`);
      return;
    }
    setSaving(true);
    setSubmitError(null);

    const supabase = createClient();

    // Créer ou récupérer la progression
    let pid = progressId;
    if (!pid) {
      const { data: prog } = await supabase
        .from("mission_progress")
        .select("id")
        .eq("mission_id", mission.id)
        .eq("profile_id", user.id)
        .maybeSingle();
      if (prog?.id) pid = prog.id;
    }

    if (!pid) {
      // Créer une nouvelle progression
      const { data: newProg } = await supabase
        .from("mission_progress")
        .insert({ mission_id: mission.id, profile_id: user.id })
        .select("id")
        .single();
      if (newProg?.id) pid = newProg.id;
    }

    if (!pid) {
      setSaving(false);
      setSubmitError("Erreur : impossible de créer la progression.");
      return;
    }

    const contenu = mission.champs && mission.champs.length > 0
      ? formatContenu(mission.champs, reponses)
      : JSON.stringify(reponses, null, 2);

    const { error: subError } = await supabase.from("mission_submissions").insert({
      mission_progress_id: pid,
      reponses,
      contenu,
      statut: "soumis",
    });

    if (subError) {
      setSaving(false);
      setSubmitError("Une erreur est survenue. Réessayez.");
      return;
    }

    // Si c'est la mission 1.1, calculer et enregistrer le diagnostic
    if (mission.code === "1.1" && mission.champs) {
      const answers: Record<string, number> = {};
      for (const champ of mission.champs) {
        if (champ.type === "choix" && champ.points && reponses[champ.cle]) {
          const optIndex = champ.options?.indexOf(reponses[champ.cle] as string) ?? -1;
          answers[champ.cle as keyof typeof answers] = champ.points[optIndex] ?? 0;
        }
      }
      // Mapper les clés vers les catégories de diagnostic
      const categoryMap: Record<string, string> = {
        offre: "offre",
        positionnement: "positionnement",
        audience: "audience",
        acquisition: "acquisition",
        captureDeLeads: "captureDeLeads",
        funnel: "funnel",
        conversion: "conversion",
        relance: "relance",
        analytics: "analytics",
      };
      const diagnosticAnswers: any = {};
      for (const [key, cat] of Object.entries(categoryMap)) {
        diagnosticAnswers[cat] = answers[key] ?? 0;
      }
      const { computeDiagnosticResult } = await import("@/lib/diagnostic/scoring");
      const result = computeDiagnosticResult(diagnosticAnswers);
      await supabase.from("diagnostics").insert({
        profile_id: user.id,
        answers: diagnosticAnswers,
        score: result.score,
        priorities: result.priorities,
      });
      setComputedScore(result.score);
    }

    setSaving(false);
    localStorage.removeItem(`mission_draft_${mission.id}`);
    onSubmitted();
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10 pb-24 sm:pb-10">
        <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ochre hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Retour au dashboard
        </Link>
        <PremiumCard className="text-center py-12" glow>
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-success" />
          <h2 className="t-display-mid text-2xl text-dark">Mission soumise !</h2>
          <p className="mt-3 text-secondary">
            Votre coach va la vérifier. Vous recevrez un retour sous peu.
          </p>
          {computedScore !== null && (
            <div className="mt-6">
              <p className="text-sm text-secondary">Votre Funnel Score : </p>
              <p className="t-chiffre text-5xl text-gold">{computedScore}<span className="text-lg text-secondary">/100</span></p>
            </div>
          )}
        </PremiumCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 pb-24 sm:pb-10">
      <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ochre hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Retour au dashboard
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <Badge tone="default">{mission.code}</Badge>
          <span className="flex items-center gap-1 text-sm text-secondary">
            <Clock className="h-3.5 w-3.5" />
            ~{mission.estimated_duration_minutes} min
          </span>
        </div>
        <h1 className="t-display-mid text-[clamp(1.5rem,4vw,2.25rem)] text-dark">
          {mission.title}
        </h1>
        <p className="mt-2 text-secondary">{mission.objective}</p>
      </div>

      {/* Pourquoi */}
      {mission.why && (
        <PremiumCard className="mb-6 border-l-[3px] border-l-gold" glow>
          <p className="text-sm text-dark">{mission.why}</p>
        </PremiumCard>
      )}

      {/* Exemple Avant / Après */}
      {(mission.exemple_avant || mission.exemple_apres) && (
        <PremiumCard title="Exemple" className="mb-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {mission.exemple_avant && (
              <div className="rounded-[2px] border border-error/20 bg-error/5 p-3">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-error">
                  <XCircle className="h-3.5 w-3.5" /> Avant
                </p>
                <p className="text-sm text-secondary">{mission.exemple_avant}</p>
              </div>
            )}
            {mission.exemple_apres && (
              <div className="rounded-[2px] border border-success/20 bg-success/5 p-3">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Après
                </p>
                <p className="text-sm text-dark">{mission.exemple_apres}</p>
              </div>
            )}
          </div>
        </PremiumCard>
      )}

      {/* Bloc Systeme.io */}
      {mission.guide_outil && mission.guide_outil.length > 0 && (
        <PremiumCard title="Faites-le dans Systeme.io" className="mb-6">
          <ol className="space-y-3">
            {mission.guide_outil.map((etape, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-ochre">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium text-dark">{etape.titre}</p>
                  {etape.texte && <p className="mt-0.5 text-sm text-secondary">{etape.texte}</p>}
                  {etape.lien_video && (
                    <a
                      href={etape.lien_video}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-ochre hover:underline"
                    >
                      <Play className="h-3 w-3" /> Voir la vidéo
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </PremiumCard>
      )}

      {/* Formulaire guidé */}
      {mission.champs && mission.champs.length > 0 ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {mission.champs.map((champ) => (
            <PremiumCard key={champ.cle} title={champ.libelle + (champ.obligatoire ? " *" : "")}>
              {champ.aide && (
                <p className="mb-2 text-xs text-secondary">{champ.aide}</p>
              )}
              <ChampInput
                champ={champ}
                value={reponses[champ.cle] ?? ""}
                onChange={(val) => setChamp(champ.cle, val)}
              />
            </PremiumCard>
          ))}

          {/* Calcul en direct pour la mission 1.2 */}
          {mission.code === "1.2" && reponses["ca_vise"] && reponses["prix_moyen"] && (
            <PremiumCard title="Calcul automatique">
              {(() => {
                const ca = Number(reponses["ca_vise"]);
                const prix = Number(reponses["prix_moyen"]);
                if (isNaN(ca) || isNaN(prix) || prix === 0) return null;
                const ventes = Math.ceil(ca / prix);
                const parSemaine = (ventes / 13).toFixed(1);
                return (
                  <p className="text-sm text-dark">
                    Soit <span className="font-bold">{ventes}</span> ventes en 90 jours, environ{" "}
                    <span className="font-bold">{parSemaine}</span> par semaine.
                  </p>
                );
              })()}
            </PremiumCard>
          )}

          {submitError && <p className="text-sm text-error">{submitError}</p>}

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? "Soumission en cours…" : "Soumettre mon livrable"}
          </Button>
        </form>
      ) : (
        // Compatibilité : champ libre existant
        <LegacyForm mission={mission} progressId={progressId} onSubmitted={onSubmitted} />
      )}

      {/* Critères */}
      {mission.criteres.length > 0 && (
        <PremiumCard className="mt-6" title={`Votre coach vérifiera que…`}>
          <ul className="space-y-2">
            {mission.criteres.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-secondary">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                {c}
              </li>
            ))}
          </ul>
        </PremiumCard>
      )}

      {/* Bloc prompts IA */}
      {mission.prompts_ia && mission.prompts_ia.length > 0 && (
        <PremiumCard title="Rédigez avec l&apos;IA" className="mt-6">
          <div className="space-y-4">
            {mission.prompts_ia.map((p, i) => {
              const resolvedPrompt = replacePromptVariables(p.prompt, reponses);
              return (
                <div key={i} className="rounded-[2px] border border-dark/10 p-3">
                  <p className="mb-2 font-medium text-dark">{p.titre}</p>
                  <div className="relative rounded-[2px] bg-paper p-3">
                    <pre className="whitespace-pre-wrap text-sm text-secondary font-mono">
                      {resolvedPrompt}
                    </pre>
                    <button
                      type="button"
                      className="absolute right-2 top-2 rounded-[2px] border border-dark/10 px-2 py-1 text-xs text-secondary hover:border-gold/40 hover:text-ochre"
                      onClick={() => navigator.clipboard.writeText(resolvedPrompt)}
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </PremiumCard>
      )}

      {/* Bonus Elite */}
      {mission.bonus_elite ? (
        <PremiumCard className="mt-6 border-l-[3px] border-l-gold" glow>
          <div dangerouslySetInnerHTML={{ __html: mission.bonus_elite }} className="text-sm text-dark" />
        </PremiumCard>
      ) : null}
    </div>
  );
}

function LegacyForm({
  mission,
  progressId,
  onSubmitted,
}: {
  mission: MissionData;
  progressId: string | null;
  onSubmitted: () => void;
}) {
  const [contenu, setContenu] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = `mission_draft_legacy_${mission.id}`;
    const saved = localStorage.getItem(key);
    if (saved) setContenu(saved);
  }, [mission.id]);

  useEffect(() => {
    localStorage.setItem(`mission_draft_legacy_${mission.id}`, contenu);
  }, [contenu, mission.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contenu.trim()) {
      setError("Veuillez écrire votre livrable.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    let pid = progressId;
    if (!pid) {
      const { data: prog } = await supabase
        .from("mission_progress")
        .select("id")
        .eq("mission_id", mission.id)
        .eq("profile_id", (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();
      if (prog?.id) pid = prog.id;
    }
    if (!pid) {
      setSaving(false);
      setError("Erreur : aucune progression trouvée.");
      return;
    }
    const { error: subError } = await supabase.from("mission_submissions").insert({
      mission_progress_id: pid,
      contenu,
      statut: "soumis",
    });
    setSaving(false);
    if (subError) {
      setError("Une erreur est survenue. Réessayez.");
      return;
    }
    localStorage.removeItem(`mission_draft_legacy_${mission.id}`);
    onSubmitted();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PremiumCard>
        <textarea
          className="h-64 w-full rounded-[2px] border border-dark/10 bg-paper px-3 py-2 text-sm text-dark placeholder:text-secondary/40 focus:border-gold/60 focus:outline-none"
          placeholder="Écrivez votre livrable ici…"
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
        />
      </PremiumCard>
      {error && <p className="text-sm text-error">{error}</p>}
      <Button type="submit" disabled={saving} className="w-full">
        {saving ? "Soumission en cours…" : "Soumettre mon livrable"}
      </Button>
    </form>
  );
}
