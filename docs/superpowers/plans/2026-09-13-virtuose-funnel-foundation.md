# Virtuose Funnel — Fondation (Plan 1/N) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Virtuose Funnel Next.js/Supabase application with its design system, auth, onboarding, diagnostic and the "Mon Parcours" dashboard — the smallest slice of the spec that a real user can sign up, complete, and see progress in.

**Architecture:** Next.js 14 App Router + TypeScript, styled with Tailwind CSS using the Virtuose Funnel token palette. Supabase provides Postgres + Auth + RLS; `@supabase/ssr` gives browser and server clients. Business logic (diagnostic scoring, onboarding validation) lives in pure, unit-tested functions under `src/lib/`, decoupled from the React components that call them, per spec Rule 5 (§40).

**Tech Stack:** Next.js 14, React 18, TypeScript 5, Tailwind CSS 3, Supabase (`@supabase/supabase-js`, `@supabase/ssr`), Vitest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-13-virtuose-funnel-platform.md`

## Global Constraints

- Interface entièrement en français : tous les libellés, boutons, messages UI (spec §2, §28).
- Palette de couleurs exacte du spec §4 : Deep Navy `#0B1220`, Royal Blue `#155EEF`, Electric Blue `#2F80ED`, White `#FFFFFF`, Soft Background `#F7F9FC`, Dark Text `#101828`, Secondary Text `#667085`, Success `#12B76A`, Warning `#F79009`, Error `#F04438`. Ne pas utiliser toutes les couleurs partout — dominante Navy + White + Blue (spec §4).
- Police : Inter (spec §5).
- Jamais de secret en dur — toutes les clés Supabase via variables d'environnement (spec §25, §27).
- Row Level Security activée sur chaque table dès sa création, un utilisateur n'accède qu'à ses propres données (spec §26, §27).
- Pas de fausse fonctionnalité qui a l'air réelle mais ne fonctionne pas ; un livrable non complet dans cette phase doit être un placeholder explicite et propre (spec Règles 1–2, §40).
- Ne pas construire de LMS générique ni sur-ingénierer le MVP (spec Règles 7–8, §40).
- Chaque écran doit répondre à « Que dois-je faire ensuite ? » (spec Règle 10, §40).
- Mobile-first, layout mobile pensé (pas un rétrécissement du desktop) (spec §22) — cette contrainte est posée ici ; son exécution complète (nav basse mobile, tests responsive) est traitée au Plan 2+ (spec §39 phase 12), cette fondation doit rester correcte à 375px sans y être polie.

## Scope note (lecture obligatoire avant d'exécuter)

Le spec (`docs/superpowers/specs/2026-09-13-virtuose-funnel-platform.md`) couvre au moins 8 sous-systèmes indépendants. Ce plan ne couvre que la **Fondation** : socle technique, design system minimal, schéma DB de base, auth, onboarding, diagnostic, et le dashboard "Mon Parcours" en lecture seule (spec §39 phases 1–4, MVP §41 items 1–4, et §41 item 5 partiellement — liste des 8 étapes sans pages de contenu par étape). Les sous-systèmes suivants sont volontairement **hors scope** ici et feront chacun l'objet d'un plan séparé une fois la fondation posée :

- Missions détaillées, soumission de livrable, feedback coach (§13, §18) → Plan 2.
- Dashboard coach / vue de cohorte (§19) → Plan 3.
- Visualiseur de funnel (§15) → Plan 4.
- Virtuose AI (§16) → Plan 5.
- Bibliothèque de ressources (§17) → Plan 6.
- Communauté (§20) → Plan 7.
- Mes Résultats / analytics business (§21, §33) → Plan 8.
- CMS Admin (§32), pricing configurable (§31), nouvelle landing page publique (§30) → Plans ultérieurs.

Le fichier `index.html` (ancienne landing statique DigitalStartGo Elite) est déplacé vers `legacy/landing-static/index.html` : il documente l'historique mais n'est plus la page servie une fois l'app Next.js en place.

## File Structure

```
package.json, tsconfig.json, next.config.mjs, tailwind.config.ts, postcss.config.mjs
.eslintrc.json, .gitignore, .env.local.example
vitest.config.ts, vitest.setup.ts

legacy/landing-static/index.html          # ancienne landing, conservée telle quelle

src/app/layout.tsx                        # <html lang="fr">, police Inter, import globals.css
src/app/globals.css                       # reset + tokens Tailwind
src/app/page.tsx                          # placeholder public minimal (redirige vers /login ou /dashboard)

src/app/(auth)/login/page.tsx
src/app/(auth)/signup/page.tsx
src/middleware.ts                         # protège /(app)/*, redirige les sessions déjà connectées hors de /login /signup

src/app/(app)/layout.tsx                  # coquille appli : SidebarNav + BottomNav + zone de contenu
src/app/(app)/onboarding/page.tsx
src/app/(app)/diagnostic/page.tsx
src/app/(app)/dashboard/page.tsx          # "Mon Parcours"

src/components/ui/Button.tsx (+ .test.tsx)
src/components/ui/Card.tsx (+ .test.tsx)
src/components/ui/Badge.tsx (+ .test.tsx)
src/components/ui/ProgressBar.tsx (+ .test.tsx)
src/components/nav/SidebarNav.tsx
src/components/nav/BottomNav.tsx

src/lib/supabase/client.ts                # createClient() navigateur
src/lib/supabase/server.ts                # createClient() serveur (RSC / Server Actions)
src/lib/diagnostic/scoring.ts (+ scoring.test.ts)
src/lib/onboarding/validation.ts (+ validation.test.ts)

supabase/migrations/0001_init.sql
supabase/seed.sql
```

---

### Task 1: Scaffold du projet Next.js + TypeScript + Tailwind

**Files:**
- Move: `index.html` → `legacy/landing-static/index.html`
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `.eslintrc.json`, `.gitignore`, `.env.local.example`
- Create: `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`

**Interfaces:**
- Produces: le projet Next.js buildable (`npm run build`), la palette de couleurs Tailwind (`bg-navy`, `text-royal`, `bg-electric`, `bg-soft`, `text-dark`, `text-secondary`, `bg-success`, `bg-warning`, `bg-error`) utilisée par toutes les tâches UI suivantes.

- [ ] **Step 1: Déplacer l'ancienne landing statique**

```bash
mkdir -p legacy/landing-static
git mv index.html legacy/landing-static/index.html
```

- [ ] **Step 2: Créer `package.json`**

```json
{
  "name": "virtuose-funnel",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@supabase/supabase-js": "^2.45.0",
    "@supabase/ssr": "^0.5.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0",
    "vitest": "^2.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^25.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.5.0"
  }
}
```

- [ ] **Step 3: Créer `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Créer `next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {};
export default nextConfig;
```

- [ ] **Step 5: Créer `tailwind.config.ts`** avec la palette exacte du spec §4

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0B1220",
        royal: "#155EEF",
        electric: "#2F80ED",
        soft: "#F7F9FC",
        dark: "#101828",
        secondary: "#667085",
        success: "#12B76A",
        warning: "#F79009",
        error: "#F04438",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 6: Créer `postcss.config.mjs`, `.eslintrc.json`, `.gitignore`, `.env.local.example`**

```js
// postcss.config.mjs
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

```json
// .eslintrc.json
{ "extends": "next/core-web-vitals" }
```

```
# .gitignore
node_modules
.next
.env.local
.env*.local
coverage
```

```
# .env.local.example
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

- [ ] **Step 7: Créer `src/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-soft text-dark;
}
```

- [ ] **Step 8: Créer `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Virtuose Funnel",
  description: "Transformez votre audience en système de vente.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 9: Créer `src/app/page.tsx`** (placeholder public — la vraie landing premium est le Plan "Landing page", spec §30)

```tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-navy px-6 text-center text-white">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-electric">
        Virtuose Funnel
      </p>
      <h1 className="max-w-2xl text-4xl font-extrabold sm:text-5xl">
        Transformez votre audience en système de vente.
      </h1>
      <Link
        href="/signup"
        className="rounded-lg bg-royal px-6 py-3 font-semibold text-white transition hover:bg-electric"
      >
        Construire mon système de vente
      </Link>
    </main>
  );
}
```

- [ ] **Step 10: Installer et vérifier le build**

```bash
npm install
npm run build
```

Expected: le build Next.js se termine sans erreur (route `/` statique générée).

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "Initialise le socle Next.js/TypeScript/Tailwind de Virtuose Funnel"
```

---

### Task 2: Configuration des tests (Vitest + Testing Library)

**Files:**
- Create: `vitest.config.ts`, `vitest.setup.ts`
- Modify: `package.json` (déjà fait à la Task 1, script `test` présent)

**Interfaces:**
- Produces: `npm test` exécutable par toutes les tâches suivantes ; `render`/`screen` disponibles via `@testing-library/react` avec les matchers `@testing-library/jest-dom`.

- [ ] **Step 1: Créer `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
});
```

- [ ] **Step 2: Créer `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: Créer un test trivial pour vérifier l'installation**

`src/lib/sanity.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("sanity", () => {
  it("Vitest est opérationnel", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: Lancer les tests**

```bash
npm test
```

Expected: 1 fichier de test, 1 test PASS.

- [ ] **Step 5: Supprimer le test trivial et committer**

```bash
rm src/lib/sanity.test.ts
git add -A
git commit -m "Configure Vitest et Testing Library"
```

---

### Task 3: Design system — primitives UI (Button, Card, Badge, ProgressBar)

**Files:**
- Create: `src/components/ui/Button.tsx`, `src/components/ui/Button.test.tsx`
- Create: `src/components/ui/Card.tsx`, `src/components/ui/Card.test.tsx`
- Create: `src/components/ui/Badge.tsx`, `src/components/ui/Badge.test.tsx`
- Create: `src/components/ui/ProgressBar.tsx`, `src/components/ui/ProgressBar.test.tsx`

**Interfaces:**
- Consumes: palette Tailwind de la Task 1 (`bg-royal`, `bg-navy`, `bg-soft`, `text-secondary`, `bg-success`, `bg-warning`, `bg-error`).
- Produces (utilisés par toutes les tâches UI suivantes) :
  - `Button({ variant?: "primary" | "secondary" | "ghost"; size?: "md" | "lg"; children; type?; onClick?; disabled? })`
  - `Card({ title?: string; children })`
  - `Badge({ tone?: "default" | "success" | "warning" | "error"; children })`
  - `ProgressBar({ value: number; label?: string })` — `value` en pourcentage 0–100.

- [ ] **Step 1: Écrire le test `Button.test.tsx` (doit échouer)**

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("affiche son libellé et déclenche onClick", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Continuer</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("applique le style secondaire", () => {
    render(<Button variant="secondary">Annuler</Button>);
    expect(screen.getByRole("button", { name: "Annuler" })).toHaveClass("bg-white");
  });
});
```

- [ ] **Step 2: Lancer le test — vérifier qu'il échoue**

```bash
npm test -- Button
```

Expected: FAIL — `Cannot find module './Button'`.

- [ ] **Step 3: Implémenter `Button.tsx`**

```tsx
import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg";
};

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-royal text-white hover:bg-electric",
  secondary: "bg-white text-dark border border-dark/10 hover:bg-soft",
  ghost: "bg-transparent text-royal hover:bg-royal/10",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
}
```

- [ ] **Step 4: Lancer le test — vérifier qu'il passe**

```bash
npm test -- Button
```

Expected: PASS.

- [ ] **Step 5: Écrire, faire échouer puis implémenter `ProgressBar.tsx`**

`ProgressBar.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ProgressBar } from "./ProgressBar";

describe("ProgressBar", () => {
  it("reflète la valeur en pourcentage", () => {
    render(<ProgressBar value={67} label="Progression globale" />);
    const bar = screen.getByRole("progressbar", { name: "Progression globale" });
    expect(bar).toHaveAttribute("aria-valuenow", "67");
  });

  it("plafonne la valeur affichée entre 0 et 100", () => {
    render(<ProgressBar value={140} label="Test" />);
    expect(screen.getByRole("progressbar", { name: "Test" })).toHaveAttribute(
      "aria-valuenow",
      "100"
    );
  });
});
```

Run `npm test -- ProgressBar` → FAIL (module introuvable), puis implémenter :

```tsx
export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div className="w-full">
      {label && <p className="mb-1 text-sm font-medium text-dark">{label}</p>}
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-full overflow-hidden rounded-full bg-dark/10"
      >
        <div
          className="h-full rounded-full bg-royal transition-all"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
```

Run `npm test -- ProgressBar` → PASS.

- [ ] **Step 6: Écrire, faire échouer puis implémenter `Badge.tsx`**

`Badge.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("applique la couleur de tonalité success", () => {
    render(<Badge tone="success">Validé</Badge>);
    expect(screen.getByText("Validé")).toHaveClass("bg-success/10");
  });

  it("utilise la tonalité par défaut", () => {
    render(<Badge>À faire</Badge>);
    expect(screen.getByText("À faire")).toHaveClass("bg-dark/5");
  });
});
```

Run `npm test -- Badge` → FAIL, puis implémenter :

```tsx
type Tone = "default" | "success" | "warning" | "error";

const toneClasses: Record<Tone, string> = {
  default: "bg-dark/5 text-dark",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-error/10 text-error",
};

export function Badge({ tone = "default", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}
```

Run `npm test -- Badge` → PASS.

- [ ] **Step 7: Écrire, faire échouer puis implémenter `Card.tsx`**

`Card.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Card } from "./Card";

describe("Card", () => {
  it("affiche un titre optionnel et son contenu", () => {
    render(<Card title="Ma mission">Contenu</Card>);
    expect(screen.getByText("Ma mission")).toBeInTheDocument();
    expect(screen.getByText("Contenu")).toBeInTheDocument();
  });
});
```

Run `npm test -- Card` → FAIL, puis implémenter :

```tsx
export function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dark/5 bg-white p-6 shadow-sm">
      {title && <h3 className="mb-3 font-heading text-lg font-bold text-dark">{title}</h3>}
      {children}
    </div>
  );
}
```

Run `npm test -- Card` → PASS.

- [ ] **Step 8: Lancer toute la suite et committer**

```bash
npm test
git add -A
git commit -m "Ajoute les primitives du design system : Button, Card, Badge, ProgressBar"
```

---

### Task 4: Logique de diagnostic (scoring pur, testé unitairement)

**Files:**
- Create: `src/lib/diagnostic/scoring.ts`, `src/lib/diagnostic/scoring.test.ts`

**Interfaces:**
- Produces (consommé par Task 8 — page Diagnostic, et Task 10 — Dashboard) :
  - `export type DiagnosticCategory = "offre" | "positionnement" | "audience" | "acquisition" | "captureDeLeads" | "funnel" | "conversion" | "relance" | "analytics"`
  - `export type DiagnosticAnswers = Record<DiagnosticCategory, number>` (chaque valeur 0–10)
  - `export interface DiagnosticResult { score: number; priorities: string[] }`
  - `export const DIAGNOSTIC_CATEGORIES: { id: DiagnosticCategory; label: string }[]`
  - `export function computeDiagnosticResult(answers: DiagnosticAnswers): DiagnosticResult`

- [ ] **Step 1: Écrire le test (doit échouer)**

```ts
import { describe, it, expect } from "vitest";
import { computeDiagnosticResult, type DiagnosticAnswers } from "./scoring";

const fullMarks: DiagnosticAnswers = {
  offre: 10,
  positionnement: 10,
  audience: 10,
  acquisition: 10,
  captureDeLeads: 10,
  funnel: 10,
  conversion: 10,
  relance: 10,
  analytics: 10,
};

describe("computeDiagnosticResult", () => {
  it("retourne un score de 100 quand toutes les catégories sont à 10", () => {
    expect(computeDiagnosticResult(fullMarks).score).toBe(100);
  });

  it("retourne un score de 0 quand toutes les catégories sont à 0", () => {
    const zero = Object.fromEntries(
      Object.keys(fullMarks).map((key) => [key, 0])
    ) as DiagnosticAnswers;
    expect(computeDiagnosticResult(zero).score).toBe(0);
  });

  it("identifie les 3 catégories les plus faibles comme priorités", () => {
    const answers: DiagnosticAnswers = {
      ...fullMarks,
      captureDeLeads: 1,
      relance: 2,
      positionnement: 3,
    };
    const result = computeDiagnosticResult(answers);
    expect(result.priorities).toEqual([
      "Créer un lead magnet qui capture vos prospects",
      "Mettre en place une séquence de relance",
      "Clarifier votre positionnement",
    ]);
  });
});
```

- [ ] **Step 2: Lancer le test — vérifier qu'il échoue**

```bash
npm test -- scoring
```

Expected: FAIL — `Cannot find module './scoring'`.

- [ ] **Step 3: Implémenter `scoring.ts`**

```ts
export type DiagnosticCategory =
  | "offre"
  | "positionnement"
  | "audience"
  | "acquisition"
  | "captureDeLeads"
  | "funnel"
  | "conversion"
  | "relance"
  | "analytics";

export type DiagnosticAnswers = Record<DiagnosticCategory, number>;

export interface DiagnosticResult {
  score: number;
  priorities: string[];
}

export const DIAGNOSTIC_CATEGORIES: { id: DiagnosticCategory; label: string }[] = [
  { id: "offre", label: "Votre offre" },
  { id: "positionnement", label: "Votre positionnement" },
  { id: "audience", label: "Votre audience" },
  { id: "acquisition", label: "Votre acquisition" },
  { id: "captureDeLeads", label: "Votre capture de leads" },
  { id: "funnel", label: "Votre funnel" },
  { id: "conversion", label: "Votre conversion" },
  { id: "relance", label: "Votre relance" },
  { id: "analytics", label: "Vos analytics" },
];

const PRIORITY_MESSAGES: Record<DiagnosticCategory, string> = {
  offre: "Clarifier votre promesse",
  positionnement: "Clarifier votre positionnement",
  audience: "Mieux définir votre audience cible",
  acquisition: "Structurer votre acquisition de trafic",
  captureDeLeads: "Créer un lead magnet qui capture vos prospects",
  funnel: "Construire un funnel complet de bout en bout",
  conversion: "Améliorer votre page de vente pour convertir",
  relance: "Mettre en place une séquence de relance",
  analytics: "Suivre vos métriques pour piloter vos décisions",
};

export function computeDiagnosticResult(answers: DiagnosticAnswers): DiagnosticResult {
  const entries = DIAGNOSTIC_CATEGORIES.map(({ id }) => ({ id, value: answers[id] }));
  const total = entries.reduce((sum, entry) => sum + entry.value, 0);
  const maxTotal = entries.length * 10;
  const score = Math.round((total / maxTotal) * 100);

  const priorities = [...entries]
    .sort((a, b) => a.value - b.value)
    .slice(0, 3)
    .map((entry) => PRIORITY_MESSAGES[entry.id]);

  return { score, priorities };
}
```

- [ ] **Step 4: Lancer le test — vérifier qu'il passe**

```bash
npm test -- scoring
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Ajoute le calcul du Funnel Score et des priorités du diagnostic"
```

---

### Task 5: Validation de l'onboarding (fonction pure, testée unitairement)

**Files:**
- Create: `src/lib/onboarding/validation.ts`, `src/lib/onboarding/validation.test.ts`

**Interfaces:**
- Produces (consommé par Task 9 — page Onboarding) :
  - `export interface OnboardingProfileInput { businessName: string; activity: string; targetAudience: string; mainOffer: string; price: number; currentAudienceSize: number; mainChannel: string; monthlyGoalFcfa: number }`
  - `export type OnboardingValidationErrors = Partial<Record<keyof OnboardingProfileInput, string>>`
  - `export function validateOnboardingProfile(input: Partial<OnboardingProfileInput>): OnboardingValidationErrors`

- [ ] **Step 1: Écrire le test (doit échouer)**

```ts
import { describe, it, expect } from "vitest";
import { validateOnboardingProfile } from "./validation";

describe("validateOnboardingProfile", () => {
  it("ne retourne aucune erreur pour un profil complet et valide", () => {
    const errors = validateOnboardingProfile({
      businessName: "BeniLab",
      activity: "Coaching",
      targetAudience: "Entrepreneurs francophones",
      mainOffer: "Coaching individuel",
      price: 500000,
      currentAudienceSize: 1200,
      mainChannel: "Instagram",
      monthlyGoalFcfa: 1000000,
    });
    expect(errors).toEqual({});
  });

  it("signale les champs texte obligatoires manquants", () => {
    const errors = validateOnboardingProfile({ businessName: "  " });
    expect(errors.businessName).toBe("Le nom de l'activité est obligatoire.");
    expect(errors.activity).toBe("L'activité est obligatoire.");
  });

  it("signale un prix ou un objectif mensuel non positif", () => {
    const errors = validateOnboardingProfile({ price: 0, monthlyGoalFcfa: -100 });
    expect(errors.price).toBe("Le prix doit être supérieur à 0.");
    expect(errors.monthlyGoalFcfa).toBe("L'objectif mensuel doit être supérieur à 0.");
  });
});
```

- [ ] **Step 2: Lancer le test — vérifier qu'il échoue**

```bash
npm test -- validation
```

Expected: FAIL — `Cannot find module './validation'`.

- [ ] **Step 3: Implémenter `validation.ts`**

```ts
export interface OnboardingProfileInput {
  businessName: string;
  activity: string;
  targetAudience: string;
  mainOffer: string;
  price: number;
  currentAudienceSize: number;
  mainChannel: string;
  monthlyGoalFcfa: number;
}

export type OnboardingValidationErrors = Partial<Record<keyof OnboardingProfileInput, string>>;

const REQUIRED_TEXT_FIELDS: {
  key: keyof OnboardingProfileInput;
  label: string;
}[] = [
  { key: "businessName", label: "Le nom de l'activité" },
  { key: "activity", label: "L'activité" },
  { key: "targetAudience", label: "La cible" },
  { key: "mainOffer", label: "L'offre principale" },
  { key: "mainChannel", label: "Le canal principal" },
];

export function validateOnboardingProfile(
  input: Partial<OnboardingProfileInput>
): OnboardingValidationErrors {
  const errors: OnboardingValidationErrors = {};

  for (const { key, label } of REQUIRED_TEXT_FIELDS) {
    const value = input[key];
    if (typeof value !== "string" || value.trim().length === 0) {
      errors[key] = `${label} est obligatoire.`;
    }
  }

  if (typeof input.price !== "number" || input.price <= 0) {
    errors.price = "Le prix doit être supérieur à 0.";
  }

  if (typeof input.currentAudienceSize !== "number" || input.currentAudienceSize < 0) {
    errors.currentAudienceSize = "L'audience actuelle ne peut pas être négative.";
  }

  if (typeof input.monthlyGoalFcfa !== "number" || input.monthlyGoalFcfa <= 0) {
    errors.monthlyGoalFcfa = "L'objectif mensuel doit être supérieur à 0.";
  }

  return errors;
}
```

- [ ] **Step 4: Lancer le test — vérifier qu'il passe**

```bash
npm test -- validation
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Ajoute la validation du profil d'onboarding"
```

---

### Task 6: Schéma de base de données Supabase (migration + RLS)

**Files:**
- Create: `supabase/migrations/0001_init.sql`

**Interfaces:**
- Produces : tables `profiles`, `diagnostics`, `stages`, `missions`, `mission_progress`, consommées par Task 7 (seed), Task 9 (onboarding), Task 8 (diagnostic) et Task 10 (dashboard).

- [ ] **Step 1: Créer la migration**

```sql
create extension if not exists "pgcrypto";

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  business_name text,
  activity text,
  target_audience text,
  main_offer text,
  price numeric,
  current_audience_size integer,
  main_channel text,
  monthly_goal_fcfa numeric,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

create table diagnostics (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  answers jsonb not null,
  score integer not null,
  priorities jsonb not null,
  created_at timestamptz not null default now()
);

alter table diagnostics enable row level security;

create policy "diagnostics_select_own" on diagnostics
  for select using (auth.uid() = profile_id);
create policy "diagnostics_insert_own" on diagnostics
  for insert with check (auth.uid() = profile_id);

create table stages (
  id uuid primary key default gen_random_uuid(),
  number integer not null unique,
  slug text not null unique,
  title text not null,
  objective text not null,
  order_index integer not null
);

alter table stages enable row level security;

create policy "stages_select_authenticated" on stages
  for select using (auth.role() = 'authenticated');

create table missions (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references stages(id) on delete cascade,
  number integer not null unique,
  title text not null,
  objective text not null,
  estimated_duration_minutes integer not null,
  order_index integer not null
);

alter table missions enable row level security;

create policy "missions_select_authenticated" on missions
  for select using (auth.role() = 'authenticated');

create table mission_progress (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  mission_id uuid not null references missions(id) on delete cascade,
  status text not null default 'a_faire'
    check (status in ('a_faire', 'en_cours', 'soumis', 'a_corriger', 'valide')),
  updated_at timestamptz not null default now(),
  unique (profile_id, mission_id)
);

alter table mission_progress enable row level security;

create policy "mission_progress_select_own" on mission_progress
  for select using (auth.uid() = profile_id);
create policy "mission_progress_all_own" on mission_progress
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
```

- [ ] **Step 2: Vérifier avant d'appliquer — CHECKPOINT humain**

Cette étape modifie un projet Supabase réel (nouveau ou existant). Avant de l'exécuter :
- Confirmer avec l'utilisateur quel projet Supabase utiliser (nouveau projet à créer, ou projet existant — via le MCP Supabase ou la Supabase CLI).
- Ne jamais lancer `apply_migration` / `supabase db push` sans cette confirmation explicite.

Une fois confirmé, appliquer via l'outil MCP Supabase (`apply_migration`) ou :

```bash
supabase db push
```

Expected: les 5 tables et leurs policies existent dans le projet cible (vérifiable via `list_tables`).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Ajoute le schéma initial : profiles, diagnostics, stages, missions, mission_progress"
```

---

### Task 7: Seed des 8 étapes et missions placeholder

**Files:**
- Create: `supabase/seed.sql`

**Interfaces:**
- Consumes: tables `stages`, `missions` de la Task 6.
- Produces: 8 lignes `stages` (spec §12) et 8 lignes `missions` (une mission phare par étape — placeholder explicite ; le catalogue complet de missions par étape est hors scope, voir "Scope note").

- [ ] **Step 1: Créer `supabase/seed.sql`**

```sql
insert into stages (number, slug, title, objective, order_index) values
  (1, 'diagnostic', 'Diagnostic', 'Évaluer l''état actuel de votre système de vente.', 1),
  (2, 'offre', 'Offre', 'Transformer votre expertise en une offre claire et désirable.', 2),
  (3, 'cible-positionnement', 'Cible & Positionnement', 'Définir précisément qui vous servez et pourquoi vous.', 3),
  (4, 'lead-magnet', 'Lead Magnet', 'Créer une ressource qui capture vos prospects.', 4),
  (5, 'acquisition', 'Acquisition', 'Mettre en place vos canaux de trafic.', 5),
  (6, 'funnel', 'Mon Funnel', 'Construire un funnel complet de la landing page au checkout.', 6),
  (7, 'conversion-relance', 'Conversion & Relance', 'Optimiser votre page de vente et vos séquences de relance.', 7),
  (8, 'mesure-optimisation', 'Mesure & Optimisation', 'Suivre vos métriques et améliorer en continu.', 8);

insert into missions (stage_id, number, title, objective, estimated_duration_minutes, order_index)
select s.id, s.number, m.title, m.objective, m.duration, s.number
from stages s
join (values
  (1, 'Réaliser mon diagnostic funnel', 'Obtenir mon Funnel Score et mes 3 priorités.', 15),
  (2, 'Construire mon offre irrésistible', 'Transformer mon expertise en une offre claire, désirable et commercialisable.', 90),
  (3, 'Clarifier ma cible et mon positionnement', 'Définir précisément qui je sers et le message qui lui parle.', 60),
  (4, 'Créer mon lead magnet', 'Produire une ressource gratuite qui capture mes premiers prospects.', 120),
  (5, 'Lancer mon premier canal d''acquisition', 'Mettre en place une source de trafic régulière vers mon funnel.', 90),
  (6, 'Construire ma page de vente', 'Créer une page de vente capable de transformer mes prospects en clients.', 150),
  (7, 'Mettre en place ma relance', 'Créer une séquence de relance email ou WhatsApp pour les prospects non convertis.', 90),
  (8, 'Suivre mes métriques clés', 'Mettre en place le suivi de mes leads, ventes et revenu.', 60)
) as m(number, title, objective, duration) on m.number = s.number;
```

- [ ] **Step 2: Appliquer le seed — même CHECKPOINT que Task 6**

Confirmer le projet Supabase cible avant d'exécuter (via MCP `execute_sql` ou `supabase db execute -f supabase/seed.sql`).

Expected: `select count(*) from stages` retourne 8 ; `select count(*) from missions` retourne 8.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Ajoute le seed des 8 étapes et de leurs missions phares"
```

---

### Task 8: Clients Supabase (navigateur + serveur) et middleware d'authentification

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/middleware.ts`

**Interfaces:**
- Consumes: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (variables d'environnement, spec §25/§27).
- Produces: `createClient()` (browser, dans `src/lib/supabase/client.ts`) et `createClient()` (server, dans `src/lib/supabase/server.ts`), utilisés par toutes les pages Task 9–11.

- [ ] **Step 1: Créer `src/lib/supabase/client.ts`**

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: Créer `src/lib/supabase/server.ts`**

```ts
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
}
```

- [ ] **Step 3: Créer `src/middleware.ts`**

```ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const APP_ROUTES = ["/dashboard", "/onboarding", "/diagnostic"];
const AUTH_ROUTES = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAppRoute = APP_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (!user && isAppRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/diagnostic/:path*", "/login", "/signup"],
};
```

- [ ] **Step 4: Vérifier le build**

```bash
npm run build
```

Expected: succès (le middleware compile ; aucune page ne l'exerce encore fonctionnellement, ce sera vérifié Task 9).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Ajoute les clients Supabase et le middleware de protection des routes"
```

---

### Task 9: Authentification (signup / login) et redirection post-connexion

**Files:**
- Create: `src/app/(auth)/signup/page.tsx`, `src/app/(auth)/login/page.tsx`

**Interfaces:**
- Consumes: `createClient()` de `src/lib/supabase/client.ts`.
- Produces: routes `/signup` et `/login` fonctionnelles, redirigeant vers `/onboarding` (signup) ou `/dashboard` (login) après succès.

- [ ] **Step 1: Créer `src/app/(auth)/signup/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (signUpError) {
      setError("Une erreur est survenue. Vérifiez votre email et votre mot de passe.");
      return;
    }
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-soft px-4">
      <Card title="Créer mon compte Virtuose Funnel">
        <form onSubmit={handleSubmit} className="flex w-80 flex-col gap-4">
          <input
            type="email"
            required
            placeholder="Adresse email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-dark/10 px-3 py-2"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-dark/10 px-3 py-2"
          />
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Création en cours..." : "Créer mon compte"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
```

- [ ] **Step 2: Créer `src/app/(auth)/login/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    <main className="flex min-h-screen items-center justify-center bg-soft px-4">
      <Card title="Se connecter à Virtuose Funnel">
        <form onSubmit={handleSubmit} className="flex w-80 flex-col gap-4">
          <input
            type="email"
            required
            placeholder="Adresse email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-dark/10 px-3 py-2"
          />
          <input
            type="password"
            required
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-dark/10 px-3 py-2"
          />
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Connexion en cours..." : "Se connecter"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
```

- [ ] **Step 3: Vérifier le build**

```bash
npm run build
```

Expected: succès, routes `/signup` et `/login` générées.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Ajoute les pages d'inscription et de connexion"
```

---

### Task 10: Coquille applicative (navigation) et page Onboarding

**Files:**
- Create: `src/components/nav/SidebarNav.tsx`, `src/components/nav/BottomNav.tsx`
- Create: `src/app/(app)/layout.tsx`
- Create: `src/app/(app)/onboarding/page.tsx`

**Interfaces:**
- Consumes: `Button`, `Card` (Task 3) ; `validateOnboardingProfile`, `OnboardingProfileInput` (Task 5) ; `createClient()` browser (Task 8).
- Produces: layout `(app)` englobant `dashboard`, `onboarding`, `diagnostic` ; à la soumission de l'onboarding, la table `profiles` est mise à jour avec `onboarding_completed = true`.

- [ ] **Step 1: Créer `src/components/nav/SidebarNav.tsx`** (navigation participant, spec §8)

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard", label: "Mon Parcours" },
  { href: "/diagnostic", label: "Diagnostic" },
];

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="hidden w-64 flex-col gap-1 border-r border-dark/5 bg-white p-4 sm:flex">
      <p className="mb-4 px-2 text-lg font-extrabold text-navy">Virtuose Funnel</p>
      {ITEMS.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            pathname === item.href ? "bg-royal/10 text-royal" : "text-secondary hover:bg-soft"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Créer `src/components/nav/BottomNav.tsx`** (spec §22 — navigation basse mobile)

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/dashboard", label: "Accueil" },
  { href: "/diagnostic", label: "Diagnostic" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 flex border-t border-dark/5 bg-white sm:hidden">
      {ITEMS.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={`flex-1 py-3 text-center text-xs font-medium ${
            pathname === item.href ? "text-royal" : "text-secondary"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
```

- [ ] **Step 3: Créer `src/app/(app)/layout.tsx`**

```tsx
import { SidebarNav } from "@/components/nav/SidebarNav";
import { BottomNav } from "@/components/nav/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-soft">
      <SidebarNav />
      <main className="flex-1 pb-16 sm:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
```

- [ ] **Step 4: Créer `src/app/(app)/onboarding/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validateOnboardingProfile, type OnboardingProfileInput } from "@/lib/onboarding/validation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const GOALS = [
  "Vendre une formation",
  "Vendre un produit digital",
  "Vendre du coaching",
  "Développer mon service",
  "Générer des prospects",
  "Structurer mon activité",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [goal, setGoal] = useState(GOALS[0]);
  const [form, setForm] = useState<Partial<OnboardingProfileInput>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function updateField<K extends keyof OnboardingProfileInput>(key: K, value: OnboardingProfileInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validateOnboardingProfile(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    await supabase.from("profiles").upsert({
      id: user.id,
      business_name: form.businessName,
      activity: form.activity,
      target_audience: form.targetAudience,
      main_offer: form.mainOffer,
      price: form.price,
      current_audience_size: form.currentAudienceSize,
      main_channel: form.mainChannel,
      monthly_goal_fcfa: form.monthlyGoalFcfa,
      onboarding_completed: true,
    });

    setSubmitting(false);
    router.push("/diagnostic");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <p className="text-sm font-semibold uppercase tracking-widest text-royal">
        Bienvenue dans Virtuose Funnel
      </p>
      <h1 className="mb-8 text-3xl font-extrabold text-dark">Parlez-nous de votre activité</h1>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="text-sm font-medium text-dark">
            Votre objectif
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="mt-1 w-full rounded-lg border border-dark/10 px-3 py-2"
            >
              {GOALS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          {(
            [
              ["businessName", "Nom de l'activité"],
              ["activity", "Activité"],
              ["targetAudience", "Cible"],
              ["mainOffer", "Offre principale"],
              ["mainChannel", "Canal principal"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="text-sm font-medium text-dark">
              {label}
              <input
                type="text"
                value={(form[key] as string) ?? ""}
                onChange={(e) => updateField(key, e.target.value)}
                className="mt-1 w-full rounded-lg border border-dark/10 px-3 py-2"
              />
              {errors[key] && <p className="mt-1 text-sm text-error">{errors[key]}</p>}
            </label>
          ))}

          <label className="text-sm font-medium text-dark">
            Prix de votre offre (FCFA)
            <input
              type="number"
              value={form.price ?? ""}
              onChange={(e) => updateField("price", Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-dark/10 px-3 py-2"
            />
            {errors.price && <p className="mt-1 text-sm text-error">{errors.price}</p>}
          </label>

          <label className="text-sm font-medium text-dark">
            Taille de votre audience actuelle
            <input
              type="number"
              value={form.currentAudienceSize ?? ""}
              onChange={(e) => updateField("currentAudienceSize", Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-dark/10 px-3 py-2"
            />
            {errors.currentAudienceSize && (
              <p className="mt-1 text-sm text-error">{errors.currentAudienceSize}</p>
            )}
          </label>

          <label className="text-sm font-medium text-dark">
            Objectif mensuel (FCFA)
            <input
              type="number"
              value={form.monthlyGoalFcfa ?? ""}
              onChange={(e) => updateField("monthlyGoalFcfa", Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-dark/10 px-3 py-2"
            />
            {errors.monthlyGoalFcfa && (
              <p className="mt-1 text-sm text-error">{errors.monthlyGoalFcfa}</p>
            )}
          </label>

          <Button type="submit" disabled={submitting}>
            {submitting ? "Enregistrement..." : "Continuer vers mon diagnostic"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
```

- [ ] **Step 5: Vérifier le build**

```bash
npm run build
```

Expected: succès.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Ajoute la coquille applicative et le parcours d'onboarding"
```

---

### Task 11: Page Diagnostic (questionnaire + Funnel Score)

**Files:**
- Create: `src/app/(app)/diagnostic/page.tsx`

**Interfaces:**
- Consumes: `DIAGNOSTIC_CATEGORIES`, `computeDiagnosticResult`, `DiagnosticAnswers` (Task 4) ; `Button`, `Card`, `ProgressBar` (Task 3) ; `createClient()` browser (Task 8).
- Produces: écriture d'une ligne dans `diagnostics` (colonnes `answers`, `score`, `priorities`) consommée par Task 12 (dashboard).

- [ ] **Step 1: Créer `src/app/(app)/diagnostic/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  DIAGNOSTIC_CATEGORIES,
  computeDiagnosticResult,
  type DiagnosticAnswers,
  type DiagnosticResult,
} from "@/lib/diagnostic/scoring";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";

const DEFAULT_ANSWERS: DiagnosticAnswers = DIAGNOSTIC_CATEGORIES.reduce(
  (acc, { id }) => ({ ...acc, [id]: 5 }),
  {} as DiagnosticAnswers
);

export default function DiagnosticPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<DiagnosticAnswers>(DEFAULT_ANSWERS);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const computed = computeDiagnosticResult(answers);
    setResult(computed);
    setSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("diagnostics").insert({
        profile_id: user.id,
        answers,
        score: computed.score,
        priorities: computed.priorities,
      });
    }

    setSaving(false);
  }

  if (result) {
    return (
      <div className="mx-auto max-w-xl px-6 py-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-royal">Votre Funnel Score</p>
        <p className="my-4 text-6xl font-extrabold text-navy">{result.score}/100</p>
        <Card title="Vos 3 priorités">
          <ol className="list-decimal space-y-2 pl-5 text-left text-dark">
            {result.priorities.map((priority) => (
              <li key={priority}>{priority}</li>
            ))}
          </ol>
        </Card>
        <Button className="mt-6" onClick={() => router.push("/dashboard")}>
          Commencer mon plan d'action
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-2 text-3xl font-extrabold text-dark">Diagnostic funnel</h1>
      <p className="mb-8 text-secondary">
        Évaluez chaque catégorie de 0 (à construire) à 10 (déjà maîtrisée).
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {DIAGNOSTIC_CATEGORIES.map(({ id, label }) => (
          <div key={id}>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor={id} className="text-sm font-medium text-dark">
                {label}
              </label>
              <span className="text-sm font-semibold text-royal">{answers[id]}/10</span>
            </div>
            <input
              id={id}
              type="range"
              min={0}
              max={10}
              value={answers[id]}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, [id]: Number(e.target.value) }))
              }
              className="w-full"
            />
          </div>
        ))}
        <Button type="submit" disabled={saving}>
          {saving ? "Calcul en cours..." : "Obtenir mon Funnel Score"}
        </Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Vérifier le build**

```bash
npm run build
```

Expected: succès.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Ajoute le diagnostic funnel interactif et le calcul du Funnel Score"
```

---

### Task 12: Dashboard "Mon Parcours"

**Files:**
- Create: `src/app/(app)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `createClient()` server (Task 8) ; `Card`, `Badge`, `ProgressBar` (Task 3) ; tables `profiles`, `diagnostics`, `stages`, `missions`, `mission_progress` (Task 6).
- Produces: écran "Mon Parcours" (spec §7) — dernier écran de la Fondation ; sert de point d'entrée aux plans suivants (Missions, Funnel Visualizer, etc.).

- [ ] **Step 1: Créer `src/app/(app)/dashboard/page.tsx`**

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";

const STATUS_LABELS: Record<string, string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  soumis: "Soumis",
  a_corriger: "À corriger",
  valide: "Validé",
};

const STATUS_TONE: Record<string, "default" | "success" | "warning"> = {
  a_faire: "default",
  en_cours: "warning",
  soumis: "warning",
  a_corriger: "warning",
  valide: "success",
};

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, onboarding_completed")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  const { data: stages } = await supabase
    .from("stages")
    .select("id, number, title, missions(id, number, title)")
    .order("order_index");

  const { data: progressRows } = await supabase
    .from("mission_progress")
    .select("mission_id, status")
    .eq("profile_id", user.id);

  const progressByMission = new Map((progressRows ?? []).map((row) => [row.mission_id, row.status]));

  const allMissions = (stages ?? []).flatMap((stage) => stage.missions);
  const validatedCount = allMissions.filter(
    (mission) => progressByMission.get(mission.id) === "valide"
  ).length;
  const overallProgress = allMissions.length > 0 ? (validatedCount / allMissions.length) * 100 : 0;

  const currentStage = (stages ?? []).find((stage) =>
    stage.missions.some((mission) => progressByMission.get(mission.id) !== "valide")
  );
  const currentMission = currentStage?.missions[0];

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-extrabold text-dark">
        Bonjour {profile.business_name ?? ""} 👋
      </h1>
      <p className="mb-8 text-secondary">Voici ce qui compte aujourd'hui.</p>

      <Card title="Progression globale">
        <ProgressBar value={overallProgress} label="Mon Parcours Virtuose" />
      </Card>

      {currentMission && (
        <div className="mt-6">
          <Card title={`Mission ${currentMission.number}`}>
            <p className="mb-4 text-dark">{currentMission.title}</p>
            <Badge tone={STATUS_TONE[progressByMission.get(currentMission.id) ?? "a_faire"]}>
              {STATUS_LABELS[progressByMission.get(currentMission.id) ?? "a_faire"]}
            </Badge>
          </Card>
        </div>
      )}

      <div className="mt-6">
        <Card title="Progression par étape">
          <ol className="flex flex-col gap-3">
            {(stages ?? []).map((stage) => {
              const stageMission = stage.missions[0];
              const status = stageMission ? progressByMission.get(stageMission.id) ?? "a_faire" : "a_faire";
              return (
                <li key={stage.id} className="flex items-center justify-between">
                  <span className="text-dark">
                    {String(stage.number).padStart(2, "0")} {stage.title}
                  </span>
                  <Badge tone={STATUS_TONE[status]}>{STATUS_LABELS[status]}</Badge>
                </li>
              );
            })}
          </ol>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Vérifier le build**

```bash
npm run build
```

Expected: succès.

- [ ] **Step 3: Vérification manuelle bout-en-bout**

Avec un projet Supabase migré et seedé (Tasks 6–7), lancer `npm run dev` et vérifier manuellement :
1. `/signup` crée un compte → redirige vers `/onboarding`.
2. Le formulaire d'onboarding refuse un envoi incomplet (messages d'erreur affichés) puis accepte un envoi complet → redirige vers `/diagnostic`.
3. Le diagnostic calcule un score cohérent et l'affiche → « Commencer mon plan d'action » mène à `/dashboard`.
4. Le dashboard affiche la progression (0 %), la mission en cours (Mission 1) et la liste des 8 étapes.
5. Se déconnecter puis retenter `/dashboard` directement → redirection vers `/login` (middleware Task 8).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Ajoute le dashboard Mon Parcours"
```

---

## Self-review (effectuée avant remise du plan)

- **Couverture du spec** : §1–§14 couverts pour la part Fondation ; §15–§21, §30–§33 explicitement renvoyés aux plans suivants (voir "Scope note") ; §22 posé en contrainte mais pas peaufiné (renvoyé au Plan "Polish responsive") ; §24 couvert pour les 4 primitives nécessaires à cette tranche (Button, Card, Badge, ProgressBar) — les composants restants (Modal, Drawer, Tabs, etc., §24) seront ajoutés au fil des plans qui en ont besoin plutôt que construits à vide ici (Règle 7, ne pas sur-ingénierer) ; §25–§27 couverts (stack, schéma partiel, RLS) ; §26 : tables `organizations`, `cohorts`, `programs`, `modules`, `lessons`, `mission_submissions`, `mission_feedback`, `resources`, `funnels`, `ai_*`, `notifications`, `community_*`, `business_metrics`, `achievements`, `activity_logs` sont hors scope Fondation, ajoutées par les plans correspondants (Règle 2 — pas de table créée sans le flux qui l'utilise) ; §34–§38 partiellement couverts par du code réel (validation, redirections) mais pas audités formellement — Plans "Audit sécurité"/"Audit performance" dédiés (§39 phases 13–14).
- **Scan placeholders** : aucun "TODO"/"à compléter" dans le code des tâches ; le seul renvoi explicite est le catalogue de missions (une mission phare par étape), documenté comme placeholder volontaire conforme à la Règle 2 du spec.
- **Cohérence des types** : `DiagnosticCategory`/`DiagnosticAnswers`/`DiagnosticResult` (Task 4) réutilisés à l'identique Task 11 ; `OnboardingProfileInput`/`OnboardingValidationErrors` (Task 5) réutilisés à l'identique Task 10 ; `createClient()` (Task 8) a la même signature côté browser et server, appelée sans argument dans toutes les pages ; noms de colonnes DB (`business_name`, `onboarding_completed`, `monthly_goal_fcfa`, etc.) identiques entre migration (Task 6) et code applicatif (Tasks 10, 12).
