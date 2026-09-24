"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PremiumCard } from "@/components/app-ui/PremiumCard";
import { Bot, Send, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const WELCOME_MSG = "Je suis Virtuose AI, votre copilote pour votre système de vente. Je connais votre offre, votre cible et l'étape où vous en êtes. Que souhaitez-vous travailler aujourd'hui ?";

const SUGGESTED_PROMPTS = [
  "Analyse mon offre",
  "Donne-moi 10 hooks pour mes réseaux",
  "Pourquoi mon funnel ne convertit pas ?",
  "Quelle est ma prochaine priorité ?",
];

// Simulated AI responses (in production, this would call an AI API)
const AI_RESPONSES: Record<string, string> = {
  "offre": "Votre offre a besoin d'une promesse plus spécifique. Au lieu de dire 'j'accompagne les entrepreneurs', dites 'j'aide les coaches à générer 50 leads/mois grâce à un funnel automatisé'. La différence ? Une cible précise + un résultat mesurable.",
  "hooks": "Voici 10 hooks puissants :\n1. 'Arrête de poster au hasard. Voici le système qui m'a généré 200 leads.'\n2. 'La plupart des entrepreneurs font cette erreur sur leur page de vente.'\n3. 'Ce que personne ne vous dit sur le funnel de vente.'\n4. 'J'ai testé 47 stratégies d'acquisition. Voici les 3 qui marchent vraiment.'\n5. 'Votre audience n'est pas votre problème. Votre système en est un.'\n6. 'Comment transformer 100 abonnés en 10 clients (sans payer de pub).'\n7. 'Le secret des entrepreneurs qui vendent pendant qu'ils dorment.'\n8. 'Pourquoi vos prospects disparaissent après avoir cliqué.'\n9. '3 signes que votre offre ne parle pas à la bonne personne.'\n10. 'J'ai doublé mes ventes en changeant une seule phrase.'",
  "funnel": "Votre funnel ne convertit pas probablement parce que :\n1. La landing page ne capture pas l'attention dans les 3 premières secondes\n2. Le lead magnet ne résout pas une douleur immédiate\n3. La séquence de relance est trop longue ou pas assez personnelle\n4. L'offre finale arrive trop tôt (vous n'avez pas assez nurturé)\n\nRecommendation : testez un lead magnet plus spécifique ('Guide : 5 templates de pages de vente qui convertissent') et une séquence de 3 emails maximum.",
  "priorite": "D'après votre diagnostic, votre priorité numéro 1 est de clarifier votre offre. Sans une offre claire, tout le reste (funnel, acquisition, conversion) sera inefficace. Commencez par écrire votre offre en une phrase : 'J'aide [cible] à [résultat] sans [obstacle]'.",
  "default": "C'est une excellente question. Pour vous donner une réponse pertinente, j'ai besoin de connaître votre contexte actuel. Pourriez-vous me préciser : quelle étape du parcours vous êtes, et quel est votre principal défi en ce moment ?"
};

function getAIResponse(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes("offre") || lower.includes("analyse")) return AI_RESPONSES["offre"];
  if (lower.includes("hook") || lower.includes("post")) return AI_RESPONSES["hooks"];
  if (lower.includes("funnel") || lower.includes("converti")) return AI_RESPONSES["funnel"];
  if (lower.includes("priorit") || lower.includes("prochain")) return AI_RESPONSES["priorite"];
  return AI_RESPONSES["default"];
}

export default function CoachAIPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      setMessages([{ role: "assistant", content: WELCOME_MSG, timestamp: new Date() }]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input.trim(), timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Simulate AI response delay
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1200));

    const aiResponse = getAIResponse(userMsg.content);
    const aiMsg: Message = { role: "assistant", content: aiResponse, timestamp: new Date() };
    setMessages((prev) => [...prev, aiMsg]);
    setLoading(false);
  }

  function handleSuggestedPrompt(prompt: string) {
    setInput(prompt);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 pb-24 sm:pb-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/15">
            <Bot className="h-5 w-5 text-gold" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-ochre">Assistant IA</p>
            <h1 className="t-display-mid text-[clamp(1.5rem,4vw,2rem)] text-dark">Virtuose AI</h1>
          </div>
          <span className="ml-auto flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs text-ochre">
            <Sparkles className="h-3 w-3" /> Pro
          </span>
        </div>
        <p className="mt-2 text-sm text-secondary">
          Votre copilote qui connaît votre offre, votre cible et votre étape actuelle.
        </p>
      </div>

      {/* Chat messages */}
      <PremiumCard className="mb-6 min-h-[400px] !p-0 overflow-hidden">
        <div className="flex h-[400px] flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-[2px] px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-ink text-paper"
                      : "bg-paper text-dark border border-dark/8"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <Bot className="h-3.5 w-3.5 text-gold" />
                      <span className="text-[0.625rem] font-semibold uppercase tracking-widest text-ochre">
                        Virtuose AI
                      </span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className="mt-1.5 text-[0.625rem] text-secondary/50">
                    {msg.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-[2px] bg-paper px-4 py-3 border border-dark/8">
                  <div className="flex items-center gap-1.5">
                    <Bot className="h-3.5 w-3.5 text-gold" />
                    <span className="text-[0.625rem] font-semibold uppercase tracking-widest text-ochre">
                      Virtuose AI
                    </span>
                  </div>
                  <div className="mt-2 flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-ochre/60" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-ochre/60" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-ochre/60" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested prompts */}
          {messages.length <= 2 && (
            <div className="border-t border-dark/6 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-secondary">Suggestions</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSuggestedPrompt(prompt)}
                    className="rounded-full border border-dark/15 px-3 py-1.5 text-xs text-secondary transition-colors hover:border-ochre/40 hover:text-ochre"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-dark/6 p-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question à Virtuose AI..."
              className="flex-1 rounded-[2px] border border-dark/10 bg-paper px-3 py-2 text-sm text-dark placeholder:text-secondary/50 focus:border-gold/60 focus:outline-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex items-center gap-1.5 rounded-[2px] bg-gold px-4 py-2 text-sm font-semibold text-ink transition-all hover:bg-amber disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              Envoyer
            </button>
          </form>
        </div>
      </PremiumCard>

      {/* Info */}
      <p className="text-center text-xs text-secondary/60">
        Virtuose AI utilise votre profil et votre progression pour vous donner des conseils personnalisés.
      </p>
    </div>
  );
}
