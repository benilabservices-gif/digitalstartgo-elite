export type PlanKey = "starter" | "pro" | "elite";

export interface Plan {
  key: PlanKey;
  name: string;
  amountXof: number;
  prixTroisMoisXof: number;
  engagementMois: number;
  avantages: string[];
  delaiRetourHeures: number;
}

// Source unique des prix et avantages — la landing page (Pricing.tsx), la page
// /abonnement et le paiement Cartflox lisent ici. Ne jamais dupliquer ces
// montants ou listes d'avantages ailleurs.
export const PLANS: Record<PlanKey, Plan> = {
  starter: {
    key: "starter",
    name: "Starter",
    amountXof: 99900,
    prixTroisMoisXof: 285000,
    engagementMois: 3,
    delaiRetourHeures: 72,
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
    amountXof: 199900,
    prixTroisMoisXof: 570000,
    engagementMois: 3,
    delaiRetourHeures: 48,
    avantages: [
      "Tout Starter inclus",
      "Retour du coach sous 48 h",
      "Un atelier de groupe en direct chaque semaine : offre, Systeme.io, relance",
      "Vos pages et scripts corrigés en direct devant le groupe",
      "Virtuose AI (bientôt disponible)",
    ],
  },
  elite: {
    key: "elite",
    name: "Elite",
    amountXof: 349900,
    prixTroisMoisXof: 995000,
    engagementMois: 3,
    delaiRetourHeures: 24,
    avantages: [
      "Tout Pro inclus",
      "Votre tunnel de vente premium, importé et mis en ligne avec votre coach",
      "6 séances individuelles, une par étape clé du parcours",
      "Retour du coach sous 24 h et accès direct sur WhatsApp",
      "Suivi de votre lancement pendant 14 jours",
    ],
  },
};

export function formatXof(amount: number): string {
  return `${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} FCFA`;
}
