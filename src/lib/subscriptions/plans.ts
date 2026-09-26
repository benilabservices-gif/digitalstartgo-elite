export type PlanKey = "starter" | "pro" | "elite";

export interface Plan {
  key: PlanKey;
  name: string;
  amountXof: number;
  avantages: string[];
}

// Source unique des prix et avantages — la landing page (Pricing.tsx), la page
// /abonnement et le paiement Cartflox lisent ici. Ne jamais dupliquer ces
// montants ou listes d'avantages ailleurs.
export const PLANS: Record<PlanKey, Plan> = {
  starter: {
    key: "starter",
    name: "Starter",
    amountXof: 149900,
    avantages: [
      "Le parcours complet en 8 étapes et 22 missions guidées",
      "Un retour de votre coach sur chaque livrable, sous 72 h",
      "Maîtrisez Systeme.io pas à pas pour construire vous-même votre tunnel de vente",
      "Des prompts IA prêts à l'emploi pour rédiger chaque page de votre tunnel",
      "Votre cohorte d'entrepreneurs",
    ],
  },
  pro: {
    key: "pro",
    name: "Pro",
    amountXof: 249900,
    avantages: [
      "Tout Starter inclus",
      "Retour du coach sous 48 h",
      "Une séance de groupe en direct chaque semaine, questions Systeme.io comprises",
      "Virtuose AI (bientôt disponible)",
    ],
  },
  elite: {
    key: "elite",
    name: "Elite",
    amountXof: 349900,
    avantages: [
      "Tout Pro inclus",
      "Votre tunnel de vente premium, prêt à importer dans Systeme.io",
      "Retour du coach sous 24 h",
      "2 séances individuelles par mois avec votre coach",
      "Accès direct à votre coach sur WhatsApp",
    ],
  },
};

export function formatXof(amount: number): string {
  return `${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} FCFA`;
}
