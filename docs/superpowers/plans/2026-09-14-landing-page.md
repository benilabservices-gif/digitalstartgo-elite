# Landing page publique — Virtuose Funnel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le placeholder minimal de `src/app/page.tsx` par les 13 sections de la vraie landing page publique Virtuose Funnel (spec §30), en réutilisant le design system existant.

**Architecture:** 13 composants de section autonomes sous `src/components/marketing/`, chacun assemblé dans `src/app/page.tsx`. Deux composants transverses (`Section`, `ExempleBadge`) évitent la répétition. Contenu et données provisoires vivent en constantes typées à l'intérieur de chaque fichier de section — aucune nouvelle dépendance externe, aucun appel Supabase depuis cette page publique.

**Tech Stack:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Vitest + Testing Library (déjà en place depuis le plan Fondation).

**Spec:** `docs/superpowers/specs/2026-09-14-landing-page-design.md` (référence aussi `docs/superpowers/specs/2026-09-13-virtuose-funnel-platform.md` section 30).

## Global Constraints

- Palette exacte, aucune couleur en dehors de celle-ci : Deep Navy `#0B1220` (`bg-navy`), Royal Blue `#155EEF` (`bg-royal`/`text-royal`), Electric Blue `#2F80ED` (`bg-electric`), Soft Background `#F7F9FC` (`bg-soft`), Dark Text `#101828` (`text-dark`), Secondary Text `#667085` (`text-secondary`), Success `#12B76A`, Warning `#F79009`, Error `#F04438` — **pas de couleur or/dorée** (appartenait à l'ancienne identité DigitalStartGo Elite, absente du spec Virtuose Funnel).
- Interface entièrement en français.
- Tout apostrophe littérale à l'intérieur d'un texte JSX (entre balises, pas dans une chaîne JS passée via `{...}`) doit être échappée en `&apos;` — convention déjà établie dans le plan Fondation pour satisfaire la règle ESLint `react/no-unescaped-entities` (`eslint-config-next`).
- Aucune nouvelle dépendance npm (pas de librairie d'accordéon, de carrousel ou d'icônes) — SVG inline ou caractères simples si besoin.
- Tout contenu sans donnée réelle (témoignages, prix, métriques de résultats) doit afficher le composant `ExempleBadge` à proximité — jamais présenté comme réel. Noms de témoignages génériques ("Prénom, activité"), jamais un nom qui pourrait passer pour une vraie personne.
- Le contenu de la section "Les 8 étapes" est dupliqué en dur (pas de fetch Supabase) — doit rester strictement identique aux titres/objectifs de `supabase/seed.sql`.
- Réutiliser les composants existants du design system (`Button`, `Card`, `Badge`, `ProgressBar` dans `src/components/ui/`) plutôt que d'en recréer — leurs signatures sont fixées (voir Interfaces de chaque tâche) et ne doivent pas être modifiées par ce plan.
- Pas de test dédié pour les sections purement statiques sans logique (seuls `Section`, `ExempleBadge`, `Hero` et `Faq` ont des tests) — la vérification des autres tâches est `npm run build`.

---

## File Structure

```
src/components/marketing/
  Section.tsx (+ Section.test.tsx)
  ExempleBadge.tsx (+ ExempleBadge.test.tsx)
  Hero.tsx (+ Hero.test.tsx)
  Probleme.tsx
  Transformation.tsx
  CommentCaMarche.tsx
  LesHuitEtapes.tsx
  ApercuPlateforme.tsx
  Coaching.tsx
  VirtuoseAI.tsx
  Resultats.tsx
  Temoignages.tsx
  Pricing.tsx
  Faq.tsx (+ Faq.test.tsx)
  CtaFinal.tsx

src/app/page.tsx (modifié — remplace le placeholder actuel par l'assemblage des 13 sections)
```

---

### Task 1: Composants transverses — `Section` et `ExempleBadge`

**Files:**
- Create: `src/components/marketing/Section.tsx`, `src/components/marketing/Section.test.tsx`
- Create: `src/components/marketing/ExempleBadge.tsx`, `src/components/marketing/ExempleBadge.test.tsx`

**Interfaces:**
- Consumes: `Badge` de `@/components/ui/Badge` (signature `Badge({ tone?: "default"|"success"|"warning"|"error"; children })`, déjà en place depuis le plan Fondation).
- Produces (utilisés par toutes les tâches suivantes) :
  - `Section({ tone: "dark" | "light"; id?: string; children: React.ReactNode })`
  - `ExempleBadge()` — aucune prop.

- [ ] **Step 1: Écrire le test `Section.test.tsx` (doit échouer)**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Section } from "./Section";

describe("Section", () => {
  it("applique le fond sombre et l'id fourni", () => {
    render(
      <Section tone="dark" id="ma-section">
        <p>Contenu</p>
      </Section>
    );
    const section = screen.getByText("Contenu").closest("section");
    expect(section).toHaveAttribute("id", "ma-section");
    expect(section).toHaveClass("bg-navy");
  });

  it("applique le fond clair par défaut sans id", () => {
    render(
      <Section tone="light">
        <p>Autre contenu</p>
      </Section>
    );
    const section = screen.getByText("Autre contenu").closest("section");
    expect(section).not.toHaveAttribute("id");
    expect(section).toHaveClass("bg-soft");
  });
});
```

- [ ] **Step 2: Lancer le test — vérifier qu'il échoue**

```bash
npm test -- Section
```

Expected: FAIL — `Cannot find module './Section'`.

- [ ] **Step 3: Implémenter `Section.tsx`**

```tsx
export function Section({
  tone,
  id,
  children,
}: {
  tone: "dark" | "light";
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={tone === "dark" ? "bg-navy text-white" : "bg-soft text-dark"}>
      <div className="mx-auto max-w-5xl px-6 py-20">{children}</div>
    </section>
  );
}
```

- [ ] **Step 4: Lancer le test — vérifier qu'il passe**

```bash
npm test -- Section
```

Expected: PASS (2 tests).

- [ ] **Step 5: Écrire, faire échouer puis implémenter `ExempleBadge`**

`ExempleBadge.test.tsx` :

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ExempleBadge } from "./ExempleBadge";

describe("ExempleBadge", () => {
  it("affiche le texte \"Exemple\"", () => {
    render(<ExempleBadge />);
    expect(screen.getByText("Exemple")).toBeInTheDocument();
  });
});
```

Run `npm test -- ExempleBadge` → FAIL (module introuvable), puis implémenter :

```tsx
import { Badge } from "@/components/ui/Badge";

export function ExempleBadge() {
  return <Badge tone="warning">Exemple</Badge>;
}
```

Run `npm test -- ExempleBadge` → PASS.

- [ ] **Step 6: Lancer toute la suite et committer**

```bash
npm test
git add src/components/marketing/Section.tsx src/components/marketing/Section.test.tsx src/components/marketing/ExempleBadge.tsx src/components/marketing/ExempleBadge.test.tsx
git commit -m "Ajoute les composants transverses Section et ExempleBadge de la landing page"
```

---

### Task 2: `Hero`

**Files:**
- Create: `src/components/marketing/Hero.tsx`, `src/components/marketing/Hero.test.tsx`

**Interfaces:**
- Produces: `Hero()` — aucune prop, consommé par Task 10 (assemblage de `page.tsx`).

- [ ] **Step 1: Écrire le test (doit échouer)**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Hero } from "./Hero";

describe("Hero", () => {
  it("le CTA principal pointe vers /signup", () => {
    render(<Hero />);
    expect(screen.getByRole("link", { name: "Construire mon système de vente" })).toHaveAttribute(
      "href",
      "/signup"
    );
  });

  it("le lien de connexion pointe vers /login", () => {
    render(<Hero />);
    expect(screen.getByRole("link", { name: "Déjà un compte ? Se connecter" })).toHaveAttribute(
      "href",
      "/login"
    );
  });
});
```

- [ ] **Step 2: Lancer le test — vérifier qu'il échoue**

```bash
npm test -- Hero
```

Expected: FAIL — `Cannot find module './Hero'`.

- [ ] **Step 3: Implémenter `Hero.tsx`**

```tsx
import Link from "next/link";

const NUMEROS_ETAPES = [1, 2, 3, 4, 5, 6, 7, 8];

export function Hero() {
  return (
    <section className="bg-navy px-6 py-20 text-white sm:py-28">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-12 text-center sm:flex-row sm:text-left">
        <div className="flex flex-1 flex-col items-center gap-6 sm:items-start">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-electric">
            Virtuose Funnel
          </p>
          <h1 className="max-w-xl text-4xl font-extrabold sm:text-5xl">
            Transformez votre audience en système de vente.
          </h1>
          <p className="max-w-xl text-white/70">
            Un programme d&apos;accompagnement guidé pour construire, lancer et optimiser votre
            système d&apos;acquisition et de conversion.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-lg bg-royal px-6 py-3 font-semibold text-white transition hover:bg-electric"
            >
              Construire mon système de vente
            </Link>
            <a
              href="#comment-ca-marche"
              className="rounded-lg px-6 py-3 font-semibold text-white/80 transition hover:text-white"
            >
              Découvrir le programme
            </a>
          </div>
          <Link href="/login" className="text-sm text-white/70 hover:text-white hover:underline">
            Déjà un compte ? Se connecter
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center gap-2">
          {NUMEROS_ETAPES.map((numero) => (
            <div
              key={numero}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-royal to-electric text-xs font-bold text-white"
            >
              {numero}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Lancer le test — vérifier qu'il passe**

```bash
npm test -- Hero
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/marketing/Hero.tsx src/components/marketing/Hero.test.tsx
git commit -m "Ajoute la section Hero de la landing page"
```

---

### Task 3: `Probleme` et `Transformation`

**Files:**
- Create: `src/components/marketing/Probleme.tsx`
- Create: `src/components/marketing/Transformation.tsx`

**Interfaces:**
- Consumes: `Section` (Task 1), `Card` de `@/components/ui/Card` (signature `Card({ title?: string; children })`).
- Produces: `Probleme()`, `Transformation()` — consommés par Task 10.

- [ ] **Step 1: Créer `Probleme.tsx`**

```tsx
import { Section } from "./Section";
import { Card } from "@/components/ui/Card";

const FRICTIONS = [
  {
    titre: "Une offre floue",
    description:
      "Vos prospects ne comprennent pas en une phrase ce que vous vendez ni pourquoi vous.",
  },
  {
    titre: "Une audience sans funnel",
    description: "Vous publiez, mais rien ne transforme vos abonnés en prospects qualifiés.",
  },
  {
    titre: "Des prospects qui ne convertissent jamais",
    description: "Ils s'intéressent, puis disparaissent — aucune relance ne les ramène.",
  },
  {
    titre: "Aucune mesure de ce qui marche",
    description: "Vous avancez à l'instinct, sans savoir quelle action a réellement un impact.",
  },
];

export function Probleme() {
  return (
    <Section tone="light">
      <h2 className="mb-10 text-center text-3xl font-extrabold text-dark sm:text-4xl">
        La plupart des entrepreneurs n&apos;ont pas un problème de trafic.
        <br />
        Ils ont un problème de système.
      </h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {FRICTIONS.map((friction) => (
          <Card key={friction.titre} title={friction.titre}>
            <p className="text-secondary">{friction.description}</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}
```

- [ ] **Step 2: Créer `Transformation.tsx`**

```tsx
import { Section } from "./Section";
import { Card } from "@/components/ui/Card";

const AVANT = [
  "Vous dispersez vos efforts",
  "Vous devinez ce qui pourrait marcher",
  "Vous publiez au hasard",
];
const APRES = [
  "Vous suivez un système structuré",
  "Vous exécutez des actions guidées",
  "Vous mesurez chaque résultat",
];

export function Transformation() {
  return (
    <Section tone="light">
      <h2 className="mb-10 text-center text-3xl font-extrabold text-dark sm:text-4xl">
        La transformation Virtuose Funnel
      </h2>
      <div className="grid gap-6 sm:grid-cols-2">
        <Card title="Avant">
          <ul className="flex flex-col gap-3 text-secondary">
            {AVANT.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
        <Card title="Après">
          <ul className="flex flex-col gap-3 text-dark">
            {APRES.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
      </div>
    </Section>
  );
}
```

- [ ] **Step 3: Vérifier le build**

```bash
npm run build
```

Expected: succès (ces composants ne sont pas encore importés dans `page.tsx` — la Task 10 fait l'assemblage final ; ce build vérifie seulement l'absence d'erreur TypeScript/JSX dans les nouveaux fichiers via la compilation du projet).

- [ ] **Step 4: Commit**

```bash
git add src/components/marketing/Probleme.tsx src/components/marketing/Transformation.tsx
git commit -m "Ajoute les sections Probleme et Transformation de la landing page"
```

---

### Task 4: `CommentCaMarche` et `LesHuitEtapes`

**Files:**
- Create: `src/components/marketing/CommentCaMarche.tsx`
- Create: `src/components/marketing/LesHuitEtapes.tsx`

**Interfaces:**
- Consumes: `Section` (Task 1), `Card` et `Badge` de `@/components/ui/`.
- Produces: `CommentCaMarche()` (avec l'id d'ancre `comment-ca-marche`, consommé par le lien `#comment-ca-marche` du `Hero` de la Task 2), `LesHuitEtapes()`.

- [ ] **Step 1: Créer `CommentCaMarche.tsx`**

```tsx
import { Section } from "./Section";

const ETAPES_MACRO = [
  {
    numero: "1",
    titre: "Diagnostiquez",
    description: "Évaluez votre système actuel et obtenez votre Funnel Score.",
  },
  {
    numero: "2",
    titre: "Suivez le parcours guidé",
    description: "Avancez mission par mission, à votre rythme.",
  },
  {
    numero: "3",
    titre: "Soumettez et corrigez",
    description: "Recevez un retour de coach, ajustez, validez.",
  },
  {
    numero: "4",
    titre: "Lancez et mesurez",
    description: "Mettez votre système en ligne et suivez vos résultats.",
  },
];

export function CommentCaMarche() {
  return (
    <Section tone="light" id="comment-ca-marche">
      <h2 className="mb-10 text-center text-3xl font-extrabold text-dark sm:text-4xl">
        Comment ça marche
      </h2>
      <div className="grid gap-8 sm:grid-cols-4">
        {ETAPES_MACRO.map((etape) => (
          <div
            key={etape.numero}
            className="flex flex-col items-center text-center sm:items-start sm:text-left"
          >
            <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-royal text-lg font-bold text-white">
              {etape.numero}
            </span>
            <h3 className="mb-2 text-lg font-bold text-dark">{etape.titre}</h3>
            <p className="text-secondary">{etape.description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
```

- [ ] **Step 2: Créer `LesHuitEtapes.tsx`**

Les titres et objectifs ci-dessous sont recopiés à l'identique de `supabase/seed.sql` (déjà appliqué en base) — ne pas les modifier sans mettre à jour les deux fichiers ensemble.

```tsx
import Link from "next/link";
import { Section } from "./Section";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const ETAPES = [
  { numero: 1, titre: "Diagnostic", objectif: "Évaluer l'état actuel de votre système de vente." },
  {
    numero: 2,
    titre: "Offre",
    objectif: "Transformer votre expertise en une offre claire et désirable.",
  },
  {
    numero: 3,
    titre: "Cible & Positionnement",
    objectif: "Définir précisément qui vous servez et pourquoi vous.",
  },
  { numero: 4, titre: "Lead Magnet", objectif: "Créer une ressource qui capture vos prospects." },
  { numero: 5, titre: "Acquisition", objectif: "Mettre en place vos canaux de trafic." },
  {
    numero: 6,
    titre: "Mon Funnel",
    objectif: "Construire un funnel complet de la landing page au checkout.",
  },
  {
    numero: 7,
    titre: "Conversion & Relance",
    objectif: "Optimiser votre page de vente et vos séquences de relance.",
  },
  {
    numero: 8,
    titre: "Mesure & Optimisation",
    objectif: "Suivre vos métriques et améliorer en continu.",
  },
];

export function LesHuitEtapes() {
  return (
    <Section tone="light">
      <h2 className="mb-10 text-center text-3xl font-extrabold text-dark sm:text-4xl">
        Le programme en 8 étapes
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {ETAPES.map((etape) => (
          <Card
            key={etape.numero}
            title={`${String(etape.numero).padStart(2, "0")} — ${etape.titre}`}
          >
            <p className="mb-4 text-secondary">{etape.objectif}</p>
            {etape.numero === 1 && (
              <div className="flex flex-col gap-2">
                <Badge tone="success">Commencez ici</Badge>
                <Link href="/signup" className="text-sm font-semibold text-royal hover:underline">
                  Faire mon diagnostic →
                </Link>
              </div>
            )}
          </Card>
        ))}
      </div>
    </Section>
  );
}
```

- [ ] **Step 3: Vérifier le build**

```bash
npm run build
```

Expected: succès.

- [ ] **Step 4: Commit**

```bash
git add src/components/marketing/CommentCaMarche.tsx src/components/marketing/LesHuitEtapes.tsx
git commit -m "Ajoute les sections CommentCaMarche et LesHuitEtapes de la landing page"
```

---

### Task 5: `ApercuPlateforme`

**Files:**
- Create: `src/components/marketing/ApercuPlateforme.tsx`

**Interfaces:**
- Consumes: `Section` (Task 1), `Card`, `Badge`, `ProgressBar` de `@/components/ui/` (signature `ProgressBar({ value: number; label?: string })`).
- Produces: `ApercuPlateforme()`.

- [ ] **Step 1: Créer `ApercuPlateforme.tsx`**

```tsx
import { Section } from "./Section";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";

const APERCU_ETAPES: { titre: string; statut: string; tone: "success" | "warning" | "default" }[] = [
  { titre: "01 Diagnostic", statut: "Validé", tone: "success" },
  { titre: "02 Offre", statut: "Validé", tone: "success" },
  { titre: "03 Cible & Positionnement", statut: "En cours", tone: "warning" },
  { titre: "04 Lead Magnet", statut: "À faire", tone: "default" },
];

export function ApercuPlateforme() {
  return (
    <Section tone="dark">
      <h2 className="mb-4 text-center text-3xl font-extrabold sm:text-4xl">
        Voici à quoi ressemble votre tableau de bord dès votre premier jour.
      </h2>
      <p className="mx-auto mb-10 max-w-xl text-center text-white/70">
        Mon Parcours Virtuose : votre progression, votre mission en cours, et les étapes qui vous
        rapprochent de votre prochain client.
      </p>
      <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 text-dark shadow-lg">
        <div className="mb-6">
          <ProgressBar value={25} label="Progression globale" />
        </div>
        <div className="mb-6">
          <Card title="Mission 03">
            <p className="mb-3">Clarifier ma cible et mon positionnement</p>
            <Badge tone="warning">En cours</Badge>
          </Card>
        </div>
        <ul className="flex flex-col gap-3">
          {APERCU_ETAPES.map((etape) => (
            <li key={etape.titre} className="flex items-center justify-between">
              <span>{etape.titre}</span>
              <Badge tone={etape.tone}>{etape.statut}</Badge>
            </li>
          ))}
        </ul>
      </div>
    </Section>
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
git add src/components/marketing/ApercuPlateforme.tsx
git commit -m "Ajoute la section ApercuPlateforme de la landing page"
```

---

### Task 6: `Coaching` et `VirtuoseAI`

**Files:**
- Create: `src/components/marketing/Coaching.tsx`
- Create: `src/components/marketing/VirtuoseAI.tsx`

**Interfaces:**
- Consumes: `Section` (Task 1).
- Produces: `Coaching()`, `VirtuoseAI()`.

- [ ] **Step 1: Créer `Coaching.tsx`**

```tsx
import { Section } from "./Section";

const POINTS = [
  {
    titre: "Vous soumettez",
    description: "Chaque mission se termine par un livrable concret que vous soumettez.",
  },
  {
    titre: "Votre coach corrige",
    description: "Un humain relit votre travail et vous dit précisément quoi ajuster.",
  },
  {
    titre: "Vous avancez avec confiance",
    description: "Vous ne passez à l'étape suivante qu'une fois votre mission validée.",
  },
];

export function Coaching() {
  return (
    <Section tone="light">
      <h2 className="mb-4 text-center text-3xl font-extrabold text-dark sm:text-4xl">
        Un humain valide chaque étape de votre progression.
      </h2>
      <p className="mx-auto mb-10 max-w-xl text-center text-secondary">
        Virtuose Funnel n&apos;est pas une formation vidéo qu&apos;on regarde. C&apos;est un
        accompagnement qu&apos;on exécute, avec un coach qui vérifie chaque livrable.
      </p>
      <div className="grid gap-6 sm:grid-cols-3">
        {POINTS.map((point) => (
          <div key={point.titre} className="text-center">
            <h3 className="mb-2 text-lg font-bold text-dark">{point.titre}</h3>
            <p className="text-secondary">{point.description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
```

- [ ] **Step 2: Créer `VirtuoseAI.tsx`**

```tsx
import { Section } from "./Section";

const PROMPTS = [
  "Analyse mon offre",
  "Donne-moi 10 hooks",
  "Pourquoi mon funnel ne convertit pas ?",
  "Écris ma séquence email",
];

export function VirtuoseAI() {
  return (
    <Section tone="dark">
      <h2 className="mb-4 text-center text-3xl font-extrabold sm:text-4xl">Virtuose AI</h2>
      <p className="mx-auto mb-10 max-w-xl text-center text-white/70">
        Un coach funnel disponible en continu, qui connaît votre offre, votre audience et votre
        progression.
      </p>
      <div className="mx-auto flex max-w-xl flex-col gap-3">
        {PROMPTS.map((prompt) => (
          <div
            key={prompt}
            className="self-start rounded-2xl rounded-bl-none bg-white/10 px-4 py-3 text-sm text-white"
          >
            {prompt}
          </div>
        ))}
      </div>
      <p className="mt-8 text-center text-xs uppercase tracking-widest text-white/50">
        Disponible dans le programme
      </p>
    </Section>
  );
}
```

- [ ] **Step 3: Vérifier le build**

```bash
npm run build
```

Expected: succès.

- [ ] **Step 4: Commit**

```bash
git add src/components/marketing/Coaching.tsx src/components/marketing/VirtuoseAI.tsx
git commit -m "Ajoute les sections Coaching et VirtuoseAI de la landing page"
```

---

### Task 7: `Resultats` et `Temoignages`

**Files:**
- Create: `src/components/marketing/Resultats.tsx`
- Create: `src/components/marketing/Temoignages.tsx`

**Interfaces:**
- Consumes: `Section` (Task 1), `ExempleBadge` (Task 1), `Card` de `@/components/ui/Card`.
- Produces: `Resultats()`, `Temoignages()`.

- [ ] **Step 1: Créer `Resultats.tsx`**

```tsx
import { Section } from "./Section";
import { ExempleBadge } from "./ExempleBadge";

const METRIQUES = [
  { label: "Leads", valeur: "428" },
  { label: "Taux de conversion", valeur: "6,2 %" },
  { label: "Ventes", valeur: "37" },
  { label: "Revenu", valeur: "1 110 000 FCFA" },
];

export function Resultats() {
  return (
    <Section tone="light">
      <div className="mb-6 flex items-center justify-center gap-3">
        <h2 className="text-center text-3xl font-extrabold text-dark sm:text-4xl">
          Vos résultats
        </h2>
        <ExempleBadge />
      </div>
      <div className="grid gap-6 sm:grid-cols-4">
        {METRIQUES.map((metrique) => (
          <div key={metrique.label} className="text-center">
            <p className="text-3xl font-extrabold text-royal">{metrique.valeur}</p>
            <p className="text-sm text-secondary">{metrique.label}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
```

- [ ] **Step 2: Créer `Temoignages.tsx`**

```tsx
import { Section } from "./Section";
import { Card } from "@/components/ui/Card";
import { ExempleBadge } from "./ExempleBadge";

const TEMOIGNAGES = [
  {
    nom: "Awa, coach business",
    citation: "J'ai enfin un système clair au lieu de poster au hasard chaque jour.",
  },
  {
    nom: "Moussa, formateur",
    citation: "Le feedback de mon coach m'a évité des mois d'erreurs sur mon offre.",
  },
  {
    nom: "Fatou, consultante",
    citation: "Mon funnel tourne enfin sans que j'aie à tout refaire chaque semaine.",
  },
];

export function Temoignages() {
  return (
    <Section tone="light">
      <div className="mb-10 flex items-center justify-center gap-3">
        <h2 className="text-center text-3xl font-extrabold text-dark sm:text-4xl">
          Ce qu&apos;en disent les participants
        </h2>
        <ExempleBadge />
      </div>
      <div className="grid gap-6 sm:grid-cols-3">
        {TEMOIGNAGES.map((temoignage) => (
          <Card key={temoignage.nom}>
            <p className="mb-4 text-dark">&laquo; {temoignage.citation} &raquo;</p>
            <p className="text-sm font-semibold text-secondary">{temoignage.nom}</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}
```

- [ ] **Step 3: Vérifier le build**

```bash
npm run build
```

Expected: succès.

- [ ] **Step 4: Commit**

```bash
git add src/components/marketing/Resultats.tsx src/components/marketing/Temoignages.tsx
git commit -m "Ajoute les sections Resultats et Temoignages de la landing page"
```

---

### Task 8: `Pricing`

**Files:**
- Create: `src/components/marketing/Pricing.tsx`

**Interfaces:**
- Consumes: `Section` (Task 1), `ExempleBadge` (Task 1), `Card` de `@/components/ui/Card`.
- Produces: `Pricing()`.

- [ ] **Step 1: Créer `Pricing.tsx`**

`Card` n'accepte pas de `className` (signature fixée en Fondation : `Card({ title?, children })`) — la mise en avant du palier PRO se fait donc via un `div` englobant, pas en modifiant `Card`.

```tsx
import Link from "next/link";
import { Section } from "./Section";
import { Card } from "@/components/ui/Card";
import { ExempleBadge } from "./ExempleBadge";

const PALIERS = [
  {
    nom: "STARTER",
    prix: "49 000 FCFA/mois",
    misEnAvant: false,
    avantages: ["Accès au parcours en 8 étapes", "Ressources et templates", "Communauté"],
  },
  {
    nom: "PRO",
    prix: "99 000 FCFA/mois",
    misEnAvant: true,
    avantages: [
      "Tout Starter",
      "Coaching avec feedback sur chaque mission",
      "Accès à Virtuose AI",
    ],
  },
  {
    nom: "ELITE",
    prix: "199 000 FCFA/mois",
    misEnAvant: false,
    avantages: [
      "Tout Pro",
      "Sessions de coaching individuelles",
      "Revue prioritaire des livrables",
    ],
  },
];

export function Pricing() {
  return (
    <Section tone="light">
      <div className="mb-10 flex items-center justify-center gap-3">
        <h2 className="text-center text-3xl font-extrabold text-dark sm:text-4xl">Tarifs</h2>
        <ExempleBadge />
      </div>
      <div className="grid gap-6 sm:grid-cols-3">
        {PALIERS.map((palier) => (
          <div
            key={palier.nom}
            className={palier.misEnAvant ? "rounded-xl border-2 border-royal" : ""}
          >
            <Card title={palier.nom}>
              <p className="mb-4 text-2xl font-extrabold text-dark">{palier.prix}</p>
              <ul className="mb-6 flex flex-col gap-2 text-secondary">
                {palier.avantages.map((avantage) => (
                  <li key={avantage}>{avantage}</li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block rounded-lg bg-royal px-4 py-2 text-center font-semibold text-white transition hover:bg-electric"
              >
                Construire mon système de vente
              </Link>
            </Card>
          </div>
        ))}
      </div>
    </Section>
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
git add src/components/marketing/Pricing.tsx
git commit -m "Ajoute la section Pricing de la landing page"
```

---

### Task 9: `Faq`

**Files:**
- Create: `src/components/marketing/Faq.tsx`, `src/components/marketing/Faq.test.tsx`

**Interfaces:**
- Consumes: `Section` (Task 1).
- Produces: `Faq()` — composant client avec état local d'accordéon (un seul item ouvert à la fois).

- [ ] **Step 1: Écrire le test (doit échouer)**

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Faq } from "./Faq";

describe("Faq", () => {
  it("un item fermé par défaut s'ouvre au clic", () => {
    render(<Faq />);
    expect(screen.queryByText(/Le parcours en 8 étapes/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Combien de temps dure le programme ?"));
    expect(screen.getByText(/Le parcours en 8 étapes/)).toBeInTheDocument();
  });

  it("ouvrir un second item ferme le premier", () => {
    render(<Faq />);
    fireEvent.click(screen.getByText("Combien de temps dure le programme ?"));
    fireEvent.click(screen.getByText("Ai-je besoin d'une audience pour commencer ?"));
    expect(screen.queryByText(/Le parcours en 8 étapes/)).not.toBeInTheDocument();
    expect(screen.getByText(/Non\. Le programme vous aide/)).toBeInTheDocument();
  });

  it("re-cliquer l'item ouvert le referme", () => {
    render(<Faq />);
    const question = screen.getByText("Combien de temps dure le programme ?");
    fireEvent.click(question);
    fireEvent.click(question);
    expect(screen.queryByText(/Le parcours en 8 étapes/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Lancer le test — vérifier qu'il échoue**

```bash
npm test -- Faq
```

Expected: FAIL — `Cannot find module './Faq'`.

- [ ] **Step 3: Implémenter `Faq.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Section } from "./Section";

const QUESTIONS = [
  {
    question: "Combien de temps dure le programme ?",
    reponse: "Le parcours en 8 étapes se termine généralement en 8 à 12 semaines, à votre rythme.",
  },
  {
    question: "Ai-je besoin d'une audience pour commencer ?",
    reponse: "Non. Le programme vous aide à construire votre audience en même temps que votre offre.",
  },
  {
    question: "Comment fonctionne le coaching ?",
    reponse: "Vous soumettez un livrable par mission, votre coach le corrige, vous ajustez si besoin.",
  },
  {
    question: "Puis-je annuler ?",
    reponse: "Oui, à tout moment, sans engagement de durée.",
  },
  {
    question: "Le programme convient-il aux débutants ?",
    reponse: "Oui. Chaque mission part du principe que vous n'avez encore rien construit.",
  },
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <Section tone="light">
      <h2 className="mb-10 text-center text-3xl font-extrabold text-dark sm:text-4xl">
        Questions fréquentes
      </h2>
      <div className="mx-auto flex max-w-2xl flex-col gap-3">
        {QUESTIONS.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={item.question} className="rounded-lg border border-dark/10 bg-white">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between px-5 py-4 text-left font-semibold text-dark"
              >
                {item.question}
                <span className="ml-4 text-secondary">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && <p className="px-5 pb-4 text-secondary">{item.reponse}</p>}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
```

- [ ] **Step 4: Lancer le test — vérifier qu'il passe**

```bash
npm test -- Faq
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/marketing/Faq.tsx src/components/marketing/Faq.test.tsx
git commit -m "Ajoute la section Faq (accordéon) de la landing page"
```

---

### Task 10: `CtaFinal` et assemblage final de `page.tsx`

**Files:**
- Create: `src/components/marketing/CtaFinal.tsx`
- Modify: `src/app/page.tsx` (remplace entièrement le contenu actuel)

**Interfaces:**
- Consumes: `Section` (Task 1) ; `Hero` (Task 2) ; `Probleme`, `Transformation` (Task 3) ; `CommentCaMarche`, `LesHuitEtapes` (Task 4) ; `ApercuPlateforme` (Task 5) ; `Coaching`, `VirtuoseAI` (Task 6) ; `Resultats`, `Temoignages` (Task 7) ; `Pricing` (Task 8) ; `Faq` (Task 9).
- Produces: la page d'accueil complète, dernière tâche du plan.

- [ ] **Step 1: Créer `CtaFinal.tsx`**

```tsx
import Link from "next/link";
import { Section } from "./Section";

export function CtaFinal() {
  return (
    <Section tone="dark">
      <div className="flex flex-col items-center gap-6 text-center">
        <h2 className="max-w-xl text-3xl font-extrabold sm:text-4xl">
          Construisez votre système de vente. Lancez-le. Optimisez-le.
        </h2>
        <Link
          href="/signup"
          className="rounded-lg bg-royal px-6 py-3 font-semibold text-white transition hover:bg-electric"
        >
          Construire mon système de vente
        </Link>
      </div>
    </Section>
  );
}
```

- [ ] **Step 2: Remplacer `src/app/page.tsx`**

```tsx
import { Hero } from "@/components/marketing/Hero";
import { Probleme } from "@/components/marketing/Probleme";
import { Transformation } from "@/components/marketing/Transformation";
import { CommentCaMarche } from "@/components/marketing/CommentCaMarche";
import { LesHuitEtapes } from "@/components/marketing/LesHuitEtapes";
import { ApercuPlateforme } from "@/components/marketing/ApercuPlateforme";
import { Coaching } from "@/components/marketing/Coaching";
import { VirtuoseAI } from "@/components/marketing/VirtuoseAI";
import { Resultats } from "@/components/marketing/Resultats";
import { Temoignages } from "@/components/marketing/Temoignages";
import { Pricing } from "@/components/marketing/Pricing";
import { Faq } from "@/components/marketing/Faq";
import { CtaFinal } from "@/components/marketing/CtaFinal";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Probleme />
      <Transformation />
      <CommentCaMarche />
      <LesHuitEtapes />
      <ApercuPlateforme />
      <Coaching />
      <VirtuoseAI />
      <Resultats />
      <Temoignages />
      <Pricing />
      <Faq />
      <CtaFinal />
    </main>
  );
}
```

- [ ] **Step 3: Lancer toute la suite de tests**

```bash
npm test
```

Expected: tous les tests passent (ceux du plan Fondation + les nouveaux de ce plan : Section, ExempleBadge, Hero, Faq).

- [ ] **Step 4: Vérifier le build**

```bash
npm run build
```

Expected: succès, route `/` régénérée avec le nouveau contenu.

- [ ] **Step 5: Vérification manuelle**

Lancer `npm run dev`, ouvrir `http://localhost:3000/`, et vérifier visuellement :
1. Les 13 sections s'affichent dans l'ordre, avec l'alternance de fond sombre/clair prévue (Hero, Aperçu plateforme, Virtuose AI, CTA final en navy ; le reste en clair).
2. Le lien "Découvrir le programme" du Hero fait défiler jusqu'à la section "Comment ça marche".
3. Le clic sur une question de la FAQ l'ouvre, et un seul item reste ouvert à la fois.
4. Les badges "Exemple" sont visibles sur Résultats, Témoignages et Pricing.
5. La page reste lisible et sans débordement horizontal à 375px de large (mobile).

- [ ] **Step 6: Commit**

```bash
git add src/components/marketing/CtaFinal.tsx src/app/page.tsx
git commit -m "Assemble la landing page complete et ajoute la section CtaFinal"
```

---

## Self-review (effectuée avant remise du plan)

- **Couverture du spec** : les 13 sections de `docs/superpowers/specs/2026-09-14-landing-page-design.md` ont chacune une tâche (Task 2 à Task 10, certaines groupées par paire thématique) ; les 2 composants transverses (`Section`, `ExempleBadge`) sont couverts par la Task 1.
- **Scan placeholders** : aucun "TODO"/"à compléter" ; les données de témoignages/prix/résultats sont explicitement des exemples (badge visible), conformément à la décision prise pendant le brainstorming — ce n'est pas un placeholder de plan mais un choix produit assumé et documenté.
- **Cohérence des types** : `Section({ tone, id?, children })` utilisé à l'identique dans toutes les tâches consommatrices ; `ExempleBadge()` sans prop, utilisé à l'identique dans Task 7 et Task 8 ; les props de `Card`/`Badge`/`ProgressBar`/`Button` réutilisées correspondent exactement aux signatures fixées par le plan Fondation (vérifiées contre les fichiers réels de `src/components/ui/`) ; les titres/objectifs de `LesHuitEtapes.tsx` (Task 4) sont recopiés caractère pour caractère depuis `supabase/seed.sql`.
- **Palette** : aucune couleur en dehors de la liste des Global Constraints n'apparaît dans le code des tâches (vérification manuelle de chaque bloc `className`) — la correction "or → royal/electric" du spec a bien été répercutée dans le code de la Task 2.
