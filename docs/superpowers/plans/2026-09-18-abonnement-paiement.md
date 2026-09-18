# Virtuose Funnel — Abonnement & Paiement (Plan 6/N) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Faire payer l'accès à Virtuose Funnel via Cartflox (orchestrateur de paiement zone FCFA/mobile money) : un participant choisit un palier (Starter/Pro/Elite), paie, et l'accès est activé uniquement par confirmation serveur (webhook signé) — jamais sur la seule foi du navigateur.

**Architecture:** Trois paliers définis une seule fois (`src/lib/subscriptions/plans.ts`), réutilisés par la landing page (déjà existante) et l'écran d'abonnement. La création de session de paiement passe par une route serveur Next.js (jamais le navigateur, qui n'a pas accès à la clé secrète Cartflox). L'activation de l'abonnement passe par un webhook Next.js qui vérifie la signature HMAC Cartflox avant d'écrire quoi que ce soit, en utilisant la clé `service_role` Supabase — seule façon d'écrire en base sans session utilisateur (Cartflox appelle le serveur directement, il n'y a pas de session à ce moment-là). Aucun abonnement stocké n'a de champ « actif » : l'activité se déduit de `expires_at > maintenant`, jamais d'un statut qui pourrait devenir obsolète.

**Tech Stack:** Next.js 14 App Router (Route Handlers) + TypeScript, Supabase (Postgres + RLS + `@supabase/supabase-js` en mode service_role pour le webhook uniquement), Cartflox (API REST + webhooks signés HMAC-SHA256), Vitest.

**Spec:** `docs/superpowers/specs/2026-09-13-virtuose-funnel-platform.md` — le paiement n'est pas un sous-système du spec original ; c'est un ajout identifié lors de l'audit du 2026-09-17 (P0, bloquant avant toute vente).

## Global Constraints

- Interface entièrement en français.
- Palette et typographie déjà en place — ne pas introduire de nouvelles couleurs.
- Jamais de secret en dur — `CARTFLOX_SECRET_KEY` et `SUPABASE_SERVICE_ROLE_KEY` uniquement via variables d'environnement, jamais dans un composant client (`NEXT_PUBLIC_*` réservé à la clé publique Cartflox, non utilisée dans ce plan car toute la création de session passe par le serveur).
- RLS activée sur `subscriptions` dès sa création — aucune policy INSERT/UPDATE/DELETE pour `authenticated` : seule la route webhook (service_role) écrit.
- La confirmation de paiement vient uniquement du webhook Cartflox signé, jamais d'un paramètre d'URL ou d'un appel déclenché par le navigateur après redirection.
- Prix réels déjà publiés sur la landing page (`src/components/marketing/Pricing.tsx`) : Starter 99 900 FCFA, Pro 149 900 FCFA, Elite 249 900 FCFA, par mois. Ce plan centralise ces montants dans `src/lib/subscriptions/plans.ts` et fait pointer la landing page vers cette source unique — deux définitions séparées des mêmes prix seraient un risque réel (argent réel en jeu).

## Scope note

Cartflox fonctionne par sessions de paiement ponctuelles (pas d'abonnement récurrent géré par eux, d'après leur documentation publique). Ce plan livre donc un modèle « un paiement = accès pendant 30 jours », renouvelable en repayant avant expiration — pas de prélèvement automatique. Aucune fonctionnalité n'est différenciée entre paliers pour l'instant (voir décision actée le 2026-09-17) : le seul verrou est « as-tu un abonnement actif », peu importe le palier. La différenciation par palier (Ressources limitées en Starter, etc.) est hors scope, à faire quand il y aura du contenu réellement différent à limiter.

## File Structure

```
supabase/migrations/0006_subscriptions.sql   # table subscriptions + RLS (lecture seule pour authenticated)

src/lib/subscriptions/plans.ts               # PLANS (source unique des prix), formatXof()
src/lib/subscriptions/plans.test.ts
src/lib/subscriptions/webhook.ts             # verifyCartfloxSignature() — fonction pure
src/lib/subscriptions/webhook.test.ts

src/app/api/subscriptions/checkout/route.ts  # crée une session Cartflox, retourne l'URL de paiement
src/app/api/webhooks/cartflox/route.ts       # vérifie la signature, active l'abonnement (service_role)

src/app/(app)/abonnement/page.tsx            # écran de choix de palier
src/components/subscriptions/SubscribeButton.tsx

src/components/marketing/Pricing.tsx         # modifié : prix depuis PLANS, plus de doublon
src/middleware.ts                            # modifié : exige un abonnement actif (participants uniquement)
```

---

### Task 1: Schéma — abonnements

**Files:**
- Create: `supabase/migrations/0006_subscriptions.sql`

**Interfaces:**
- Consumes: table `profiles`.
- Produces: table `subscriptions`, consommée par Tasks 4, 5, 6.

- [ ] **Step 1: Écrire la migration**

```sql
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  plan text not null check (plan in ('starter', 'pro', 'elite')),
  cartflox_order_id text not null unique,
  amount integer not null,
  currency text not null default 'XOF',
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index subscriptions_profile_active_idx on subscriptions (profile_id, expires_at desc);

alter table subscriptions enable row level security;

create policy "subscriptions_select_own" on subscriptions
  for select to authenticated using (auth.uid() = profile_id);

-- Aucune policy insert/update/delete pour authenticated : seule la route
-- webhook (service_role, jamais exposée au client, déclenchée uniquement
-- après vérification de la signature Cartflox) peut créer un abonnement.
-- Un participant ne doit jamais pouvoir s'auto-attribuer un accès payant.
```

- [ ] **Step 2: Vérifier avant d'appliquer — CHECKPOINT humain**

Cette étape modifie le projet Supabase réel (`pixdukzflnjkzqyqilfy`). Confirmer avec l'utilisateur avant d'exécuter. Une fois confirmé, appliquer via l'outil MCP Supabase (`apply_migration`, `name: subscriptions`).

Expected: la table `subscriptions` existe avec sa policy (vérifiable via `list_tables`).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0006_subscriptions.sql
git commit -m "Ajoute le schéma des abonnements"
```

---

### Task 2: Paliers et formatage (fonctions pures)

**Files:**
- Create: `src/lib/subscriptions/plans.ts`
- Test: `src/lib/subscriptions/plans.test.ts`

**Interfaces:**
- Consumes: rien.
- Produces: `PLANS` (Record), `formatXof(amount: number): string`, consommés par Tasks 3, 4, 5, 6, et par la landing page (Task 6).

- [ ] **Step 1: Écrire le test qui échoue**

```typescript
// src/lib/subscriptions/plans.test.ts
import { describe, it, expect } from "vitest";
import { formatXof, PLANS } from "./plans";

describe("formatXof", () => {
  it("insère un espace entre les milliers", () => {
    expect(formatXof(99900)).toBe("99 900 FCFA");
  });

  it("fonctionne sur un montant à 6 chiffres", () => {
    expect(formatXof(249900)).toBe("249 900 FCFA");
  });

  it("ne casse pas sur un petit montant", () => {
    expect(formatXof(500)).toBe("500 FCFA");
  });
});

describe("PLANS", () => {
  it("expose les 3 paliers avec les prix publiés sur la landing page", () => {
    expect(PLANS.starter.amountXof).toBe(99900);
    expect(PLANS.pro.amountXof).toBe(149900);
    expect(PLANS.elite.amountXof).toBe(249900);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/lib/subscriptions/plans.test.ts`
Expected: FAIL — `plans.ts` n'existe pas encore.

- [ ] **Step 3: Écrire l'implémentation minimale**

```typescript
// src/lib/subscriptions/plans.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/lib/subscriptions/plans.test.ts`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/subscriptions/plans.ts src/lib/subscriptions/plans.test.ts
git commit -m "Ajoute les paliers d'abonnement et leur formatage (source unique des prix)"
```

---

### Task 3: Vérification de signature Cartflox (fonction pure)

**Files:**
- Create: `src/lib/subscriptions/webhook.ts`
- Test: `src/lib/subscriptions/webhook.test.ts`

**Interfaces:**
- Consumes: rien.
- Produces: `verifyCartfloxSignature(rawBody, timestampHeader, signatureHeader, secret, now?): boolean`, consommée par Task 5.

- [ ] **Step 1: Écrire le test qui échoue**

```typescript
// src/lib/subscriptions/webhook.test.ts
import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { verifyCartfloxSignature } from "./webhook";

const SECRET = "test_secret";

function sign(body: string, timestampSeconds: number, secret = SECRET) {
  const hex = crypto.createHmac("sha256", secret).update(`${timestampSeconds}.${body}`).digest("hex");
  return { timestamp: String(timestampSeconds), signature: `t=${timestampSeconds},v1=${hex}` };
}

describe("verifyCartfloxSignature", () => {
  it("accepte une signature valide et récente", () => {
    const now = Date.now();
    const { timestamp, signature } = sign("{}", Math.floor(now / 1000));
    expect(verifyCartfloxSignature("{}", timestamp, signature, SECRET, now)).toBe(true);
  });

  it("refuse une signature générée avec un autre secret", () => {
    const now = Date.now();
    const { timestamp, signature } = sign("{}", Math.floor(now / 1000), "autre_secret");
    expect(verifyCartfloxSignature("{}", timestamp, signature, SECRET, now)).toBe(false);
  });

  it("refuse un timestamp de plus de 300 secondes (rejeu)", () => {
    const now = Date.now();
    const oldTimestamp = Math.floor(now / 1000) - 400;
    const { timestamp, signature } = sign("{}", oldTimestamp);
    expect(verifyCartfloxSignature("{}", timestamp, signature, SECRET, now)).toBe(false);
  });

  it("refuse quand les en-têtes sont absents", () => {
    expect(verifyCartfloxSignature("{}", null, null, SECRET)).toBe(false);
  });

  it("refuse un corps modifié après signature", () => {
    const now = Date.now();
    const { timestamp, signature } = sign("{}", Math.floor(now / 1000));
    expect(verifyCartfloxSignature('{"amount":1}', timestamp, signature, SECRET, now)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/lib/subscriptions/webhook.test.ts`
Expected: FAIL — `webhook.ts` n'existe pas encore.

- [ ] **Step 3: Écrire l'implémentation minimale**

```typescript
// src/lib/subscriptions/webhook.ts
import crypto from "node:crypto";

// Rejette tout ce qui dépasse 300 secondes : une signature volée et
// rejouée plus tard ne doit plus être acceptée.
const MAX_SIGNATURE_AGE_SECONDS = 300;

export function verifyCartfloxSignature(
  rawBody: string,
  timestampHeader: string | null,
  signatureHeader: string | null,
  secret: string,
  now: number = Date.now()
): boolean {
  if (!timestampHeader || !signatureHeader) {
    return false;
  }

  const age = Math.abs(now / 1000 - Number(timestampHeader));
  if (!Number.isFinite(age) || age > MAX_SIGNATURE_AGE_SECONDS) {
    return false;
  }

  const providedSignature = signatureHeader
    .split(",")
    .find((part) => part.startsWith("v1="))
    ?.slice(3);
  if (!providedSignature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${timestampHeader}.${rawBody}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature);
  const providedBuffer = Buffer.from(providedSignature);

  return (
    expectedBuffer.length === providedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, providedBuffer)
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/lib/subscriptions/webhook.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/subscriptions/webhook.ts src/lib/subscriptions/webhook.test.ts
git commit -m "Ajoute la vérification de signature des webhooks Cartflox"
```

---

### Task 4: Route de création de session de paiement

**Files:**
- Create: `src/app/api/subscriptions/checkout/route.ts`

**Interfaces:**
- Consumes: `PLANS` (Task 2), `createClient` de `@/lib/supabase/server`.
- Produces: `POST /api/subscriptions/checkout`, consommée par Task 6 (`SubscribeButton`).

- [ ] **Step 1: Écrire la route**

```typescript
// src/app/api/subscriptions/checkout/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PLANS, type PlanKey } from "@/lib/subscriptions/plans";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { plan?: string } | null;
  const plan = body?.plan;

  if (!plan || !(plan in PLANS)) {
    return NextResponse.json({ error: "Palier invalide." }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const selected = PLANS[plan as PlanKey];
  const origin = new URL(request.url).origin;

  const cartfloxResponse = await fetch("https://cartflox.com/api/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CARTFLOX_SECRET_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `${user.id}-${selected.key}-${Date.now()}`,
    },
    body: JSON.stringify({
      amount: selected.amountXof,
      currency: "XOF",
      customer_email: user.email,
      description: `Virtuose Funnel — Abonnement ${selected.name}`,
      success_url: `${origin}/abonnement?statut=succes`,
      cancel_url: `${origin}/abonnement?statut=annule`,
      metadata: { profile_id: user.id, plan: selected.key },
    }),
  });

  if (!cartfloxResponse.ok) {
    return NextResponse.json({ error: "Impossible de créer la session de paiement." }, { status: 502 });
  }

  const session = (await cartfloxResponse.json()) as { url: string };
  return NextResponse.json({ url: session.url });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/subscriptions/checkout/route.ts
git commit -m "Ajoute la route de création de session de paiement Cartflox"
```

---

### Task 5: Webhook d'activation

**Files:**
- Create: `src/app/api/webhooks/cartflox/route.ts`

**Interfaces:**
- Consumes: `verifyCartfloxSignature` (Task 3).
- Produces: `POST /api/webhooks/cartflox` — écrit dans `subscriptions` (Task 1) via `service_role`.

- [ ] **Step 1: Écrire la route**

```typescript
// src/app/api/webhooks/cartflox/route.ts
import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { verifyCartfloxSignature } from "@/lib/subscriptions/webhook";

const SUBSCRIPTION_DURATION_DAYS = 30;

interface CartfloxWebhookPayload {
  event: string;
  data: {
    order_id?: string;
    amount?: number;
    currency?: string;
    metadata?: { profile_id?: string; plan?: string };
  };
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  const isValid = verifyCartfloxSignature(
    rawBody,
    request.headers.get("x-afriflow-timestamp"),
    request.headers.get("x-afriflow-signature"),
    process.env.CARTFLOX_SECRET_KEY!
  );

  if (!isValid) {
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  const payload = JSON.parse(rawBody) as CartfloxWebhookPayload;

  if (payload.event !== "payment.completed") {
    return NextResponse.json({ received: true });
  }

  const profileId = payload.data.metadata?.profile_id;
  const plan = payload.data.metadata?.plan;
  const orderId = payload.data.order_id;

  if (!profileId || !plan || !orderId) {
    return NextResponse.json({ error: "Métadonnées manquantes." }, { status: 400 });
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const expiresAt = new Date(Date.now() + SUBSCRIPTION_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // onConflict + ignoreDuplicates : Cartflox prévient qu'un webhook peut
  // arriver deux fois. cartflox_order_id est unique, donc un doublon
  // n'insère pas un deuxième abonnement.
  await supabase.from("subscriptions").upsert(
    {
      profile_id: profileId,
      plan,
      cartflox_order_id: orderId,
      amount: payload.data.amount ?? 0,
      currency: payload.data.currency ?? "XOF",
      expires_at: expiresAt,
    },
    { onConflict: "cartflox_order_id", ignoreDuplicates: true }
  );

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/webhooks/cartflox/route.ts
git commit -m "Ajoute le webhook d'activation d'abonnement Cartflox"
```

---

### Task 6: Écran d'abonnement, landing page, et verrou d'accès

**Files:**
- Create: `src/app/(app)/abonnement/page.tsx`
- Create: `src/components/subscriptions/SubscribeButton.tsx`
- Modify: `src/components/marketing/Pricing.tsx`
- Modify: `src/middleware.ts`

**Interfaces:**
- Consumes: `PLANS`, `formatXof` (Task 2).
- Produces: route `/abonnement`, page publique `Pricing` alignée sur la même source de prix.

- [ ] **Step 1: Écrire le bouton client**

```typescript
// src/components/subscriptions/SubscribeButton.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { PlanKey } from "@/lib/subscriptions/plans";

export function SubscribeButton({ plan }: { plan: PlanKey }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setLoading(true);

    const response = await fetch("/api/subscriptions/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });

    if (!response.ok) {
      setLoading(false);
      setError("Impossible de démarrer le paiement. Réessayez dans un instant.");
      return;
    }

    const { url } = (await response.json()) as { url: string };
    window.location.href = url;
  }

  return (
    <div>
      <Button type="button" onClick={handleClick} disabled={loading}>
        {loading ? "Redirection..." : "Choisir ce palier"}
      </Button>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Écrire la page abonnement**

```typescript
// src/app/(app)/abonnement/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { PLANS, formatXof, type PlanKey } from "@/lib/subscriptions/plans";
import { SubscribeButton } from "@/components/subscriptions/SubscribeButton";

export default async function AbonnementPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: activeSubscription } = await supabase
    .from("subscriptions")
    .select("plan, expires_at")
    .eq("profile_id", user.id)
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="t-display-mid text-3xl text-dark">Abonnement</h1>
      <p className="mb-8 text-secondary">
        {activeSubscription
          ? `Palier ${PLANS[activeSubscription.plan as PlanKey].name}, actif jusqu'au ${new Date(
              activeSubscription.expires_at
            ).toLocaleDateString("fr-FR")}.`
          : "Choisissez un palier pour accéder à votre Parcours."}
      </p>

      <div className="flex flex-col gap-4">
        {Object.values(PLANS).map((plan) => (
          <Card key={plan.key} title={plan.name}>
            <p className="mb-4 text-lg font-semibold text-dark">{formatXof(plan.amountXof)} / mois</p>
            <SubscribeButton plan={plan.key} />
          </Card>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Faire pointer la landing page vers la même source de prix**

Dans `src/components/marketing/Pricing.tsx`, remplacer :

```typescript
import Link from "next/link";
import { Section } from "./Section";

// Tarifs réels du produit. Montants au format français : espace fine
// insécable pour les milliers, insécable avant la devise.
const PALIERS = [
  {
    nom: "Starter",
    prix: "99 900 FCFA",
    periode: "par mois",
    misEnAvant: false,
    avantages: ["Accès au parcours en 8 étapes", "Ressources et templates", "Communauté"],
  },
  {
    nom: "Pro",
    prix: "149 900 FCFA",
    periode: "par mois",
    misEnAvant: true,
    avantages: ["Tout Starter", "Coaching avec feedback sur chaque mission", "Accès à Virtuose AI"],
  },
  {
    nom: "Elite",
    prix: "249 900 FCFA",
    periode: "par mois",
    misEnAvant: false,
    avantages: ["Tout Pro", "Sessions de coaching individuelles", "Revue prioritaire des livrables"],
  },
];
```

par :

```typescript
import Link from "next/link";
import { Section } from "./Section";
import { PLANS, formatXof } from "@/lib/subscriptions/plans";

// Les prix viennent de src/lib/subscriptions/plans.ts (source unique) :
// ne jamais redéfinir un montant ici, ça désynchroniserait la promesse
// affichée et ce qui est réellement facturé.
const PALIERS = [
  {
    nom: PLANS.starter.name,
    prix: formatXof(PLANS.starter.amountXof),
    periode: "par mois",
    misEnAvant: false,
    avantages: ["Accès au parcours en 8 étapes", "Ressources et templates", "Communauté"],
  },
  {
    nom: PLANS.pro.name,
    prix: formatXof(PLANS.pro.amountXof),
    periode: "par mois",
    misEnAvant: true,
    avantages: ["Tout Starter", "Coaching avec feedback sur chaque mission", "Accès à Virtuose AI"],
  },
  {
    nom: PLANS.elite.name,
    prix: formatXof(PLANS.elite.amountXof),
    periode: "par mois",
    misEnAvant: false,
    avantages: ["Tout Pro", "Sessions de coaching individuelles", "Revue prioritaire des livrables"],
  },
];
```

(Le reste du fichier — le composant `Pricing()` et son JSX — ne change pas.)

- [ ] **Step 4: Exiger un abonnement actif dans le middleware**

Dans `src/middleware.ts`, remplacer :

```typescript
const APP_ROUTES = ["/dashboard", "/onboarding", "/diagnostic", "/missions", "/coach", "/ressources", "/admin"];
```

par :

```typescript
const APP_ROUTES = [
  "/dashboard",
  "/onboarding",
  "/diagnostic",
  "/missions",
  "/coach",
  "/ressources",
  "/admin",
  "/abonnement",
];
```

Remplacer le bloc de vérification d'onboarding :

```typescript
  if (
    user &&
    (pathname.startsWith("/diagnostic") ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/missions") ||
      pathname.startsWith("/ressources"))
  ) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || profile.onboarding_completed !== true) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }
```

par :

```typescript
  if (
    user &&
    (pathname.startsWith("/diagnostic") ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/missions") ||
      pathname.startsWith("/ressources"))
  ) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed, role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || profile.onboarding_completed !== true) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    // /abonnement reste volontairement hors de ce contrôle (Task ci-dessus,
    // pas ajouté à cette liste) : c'est la page où corriger l'absence
    // d'abonnement, elle ne doit pas se rediriger elle-même. Les coachs et
    // admins ne sont jamais des clients payants, seuls les participants sont
    // concernés.
    if (profile.role === "participant") {
      const { data: activeSubscription } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("profile_id", user.id)
        .gt("expires_at", new Date().toISOString())
        .limit(1)
        .maybeSingle();

      if (!activeSubscription) {
        return NextResponse.redirect(new URL("/abonnement", request.url));
      }
    }
  }
```

Ajouter `"/abonnement/:path*",` au `matcher` (à côté de `"/admin/:path*",`).

- [ ] **Step 5: Commit**

```bash
git add "src/app/(app)/abonnement/page.tsx" src/components/subscriptions/SubscribeButton.tsx src/components/marketing/Pricing.tsx src/middleware.ts
git commit -m "Ajoute l'écran d'abonnement et exige un abonnement actif pour les participants"
```

---

### Task 7: Vérification finale

Avec la migration appliquée (Task 1) :

- [ ] `npm run test`, `npm run lint`, `npm run build` passent tous.
- [ ] **Conséquence à connaître avant de merger** : dès que ce plan est en ligne, tout participant sans abonnement actif est redirigé vers `/abonnement` — y compris les comptes de test existants. Accorder manuellement un abonnement de test au compte participant existant (`insert into subscriptions ...` via l'outil MCP Supabase, `expires_at` loin dans le futur) pour ne pas se bloquer soi-même pendant la vérification.
- [ ] Parcours complet à vérifier manuellement sur la preview : se connecter avec un compte sans abonnement → redirigé vers `/abonnement` → cliquer un palier → redirigé vers la page de paiement Cartflox (s'arrêter ici, ne pas payer avant confirmation avec l'utilisateur — voir note ci-dessous).
- [ ] Vérifier que la landing page affiche toujours les bons prix après le changement de source (Task 6, Step 3).
- [ ] Commit final si des ajustements ont été faits pendant la vérification.

**Note sur le test de paiement réel :** ce plan utilise des clés Cartflox de production (aucune clé de test n'a pu être récupérée, voir échanges du 2026-09-18). Un paiement réel à très petit montant, une seule fois, doit être fait avec l'accord explicite de l'utilisateur avant de considérer le parcours de paiement validé de bout en bout — ne jamais déclencher ce paiement de façon autonome.

---

## Self-Review

**Couverture :** schéma ✓ (Task 1), prix centralisés ✓ (Task 2), vérification de signature ✓ (Task 3), création de session ✓ (Task 4), activation par webhook ✓ (Task 5), écran + verrou d'accès + landing alignée ✓ (Task 6).

**Cohérence des types :** `PlanKey`, `Plan`, `PLANS`, `formatXof` définis une seule fois dans `src/lib/subscriptions/plans.ts` (Task 2), réutilisés tels quels dans Tasks 4, 5, 6 et dans `Pricing.tsx`.

**Risque signalé explicitement :** changement de comportement (paiement obligatoire pour les participants) documenté dans le middleware (Task 6) et dans la checklist de vérification (Task 7), avec la marche à suivre pour ne pas se bloquer soi-même en testant.

**Sécurité :** l'activation ne dépend que de la vérification de signature HMAC côté serveur (Task 3, testée) — jamais d'un paramètre d'URL après redirection, jamais d'un appel déclenché par le client. `service_role` n'est utilisé que dans un seul fichier serveur (Task 5), jamais exposé au navigateur.
