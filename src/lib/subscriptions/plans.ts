export type PlanKey = "starter" | "pro" | "elite";

export interface Plan {
  key: PlanKey;
  name: string;
  amountXof: number;
}

// Source unique des prix — la landing page (Pricing.tsx) les lit ici, ne
// jamais dupliquer ces montants ailleurs.
export const PLANS: Record<PlanKey, Plan> = {
  starter: { key: "starter", name: "Starter", amountXof: 99900 },
  pro: { key: "pro", name: "Pro", amountXof: 149900 },
  elite: { key: "elite", name: "Elite", amountXof: 249900 },
};

export function formatXof(amount: number): string {
  return `${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} FCFA`;
}
