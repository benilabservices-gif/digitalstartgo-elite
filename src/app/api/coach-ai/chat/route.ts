import { NextResponse } from "next/server";

// Simulated AI responses for Virtuose AI
const AI_RESPONSES: Record<string, string> = {
  offre: "Votre offre a besoin d'une promesse plus spécifique. Au lieu de dire 'j'accompagne les entrepreneurs', dites 'j'aide les coaches à générer 50 leads/mois grâce à un funnel automatisé'. La différence ? Une cible précise + un résultat mesurable.",
  hooks: "Voici 10 hooks puissants :\n1. 'Arrête de poster au hasard. Voici le système qui m'a généré 200 leads.'\n2. 'La plupart des entrepreneurs font cette erreur sur leur page de vente.'\n3. 'Ce que personne ne vous dit sur le funnel de vente.'\n4. 'J'ai testé 47 stratégies d'acquisition. Voici les 3 qui marchent vraiment.'\n5. 'Votre audience n'est pas votre problème. Votre système en est un.'\n6. 'Comment transformer 100 abonnés en 10 clients (sans payer de pub).'\n7. 'Le secret des entrepreneurs qui vendent pendant qu'ils dorment.'\n8. 'Pourquoi vos prospects disparaissent après avoir cliqué.'\n9. '3 signes que votre offre ne parle pas à la bonne personne.'\n10. 'J'ai doublé mes ventes en changeant une seule phrase.'",
  funnel: "Votre funnel ne convertit pas probablement parce que :\n1. La landing page ne capture pas l'attention dans les 3 premières secondes\n2. Le lead magnet ne résout pas une douleur immédiate\n3. La séquence de relance est trop longue ou pas assez personnelle\n4. L'offre finale arrive trop tôt (vous n'avez pas assez nurturé)\n\nRecommendation : testez un lead magnet plus spécifique et une séquence de 3 emails maximum.",
  priorite: "D'après votre diagnostic, votre priorité numéro 1 est de clarifier votre offre. Sans une offre claire, tout le reste (funnel, acquisition, conversion) sera inefficace. Commencez par écrire votre offre en une phrase : 'J'aide [cible] à [résultat] sans [obstacle]'.",
  default: "C'est une excellente question. Pour vous donner une réponse pertinente, j'ai besoin de connaître votre contexte actuel. Pourriez-vous me préciser : quelle étape du parcours vous êtes, et quel est votre principal défi en ce moment ?",
};

function getAIResponse(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes("offre") || lower.includes("analyse")) return AI_RESPONSES["offre"];
  if (lower.includes("hook") || lower.includes("post") || lower.includes("réseau")) return AI_RESPONSES["hooks"];
  if (lower.includes("funnel") || lower.includes("converti") || lower.includes("page de vente")) return AI_RESPONSES["funnel"];
  if (lower.includes("priorit") || lower.includes("prochain") || lower.includes("commencer")) return AI_RESPONSES["priorite"];
  return AI_RESPONSES["default"];
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { prompt?: string } | null;
  const prompt = body?.prompt;

  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return NextResponse.json({ error: "Prompt requis" }, { status: 400 });
  }

  const response = getAIResponse(prompt.trim());

  return NextResponse.json({ response });
}
