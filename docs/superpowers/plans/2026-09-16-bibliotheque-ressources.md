# Virtuose Funnel — Bibliothèque de ressources (Plan 4/N) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer une bibliothèque de ressources (guides pratiques + liens externes) organisée par étape du Parcours, avec une page guide imprimable en PDF via le navigateur.

**Architecture:** Une table `resources` (Postgres/Supabase) porte soit un guide au contenu structuré en blocs JSON (paragraphe/titre/liste), soit un lien externe — jamais les deux. Une fonction pure regroupe et trie les ressources par étape côté serveur ; deux pages Next.js (liste + détail) consomment cette fonction. Le bouton "Télécharger en PDF" déclenche l'impression navigateur (`window.print()`) sur une mise en page dédiée à l'impression, sans génération de fichier binaire ni bucket de stockage.

**Tech Stack:** Next.js 14 App Router + TypeScript, Supabase (Postgres + RLS), Tailwind CSS (variante `print:` native), Vitest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-13-virtuose-funnel-platform.md` (§17 Ressources) — voir Scope note ci-dessous pour ce qui est volontairement hors de ce plan.

## Global Constraints

- Interface entièrement en français : tous les libellés, boutons, messages UI (spec §2, §28).
- Palette et typographie déjà en place dans `tailwind.config.ts` / `globals.css` (ink/navy/paper/dark/secondary/gold/ochre/steel, Archivo + Newsreader) — ne pas introduire de nouvelles couleurs.
- Jamais de secret en dur — toutes les clés Supabase via variables d'environnement (spec §25, §27).
- Row Level Security activée sur `resources` dès sa création (spec §26, §27).
- Aucune fausse fonctionnalité qui a l'air réelle mais ne fonctionne pas (spec Règle 1–2, §40).
- Pas de nouvelle dépendance npm pour cette fonctionnalité : le contenu est stocké en blocs JSON structurés (pas de parseur Markdown) et le PDF passe par l'impression navigateur (pas de génération de fichier binaire).

## Scope note (lecture obligatoire avant d'exécuter)

Le spec §17 décrit une bibliothèque plus large (catégories Templates/Guides/Checklists/Scripts/Prompts IA/Exemples/Vidéos, difficulté, temps estimé, recherche et filtres). Ce plan couvre volontairement un sous-ensemble validé avec l'utilisateur : deux types de ressources (`guide` rédigé par l'équipe, `lien` externe), regroupées par étape du Parcours, sans recherche ni filtres ni difficulté/temps estimé. Pas d'interface d'ajout : le contenu est seedé par migration, une interface d'ajout viendra avec le CMS admin (plan ultérieur, spec §32).

Le contenu des 8 guides est rédigé par l'agent (voir Task 2) — original, pas de lien externe fictif : les entrées de type `lien` restent vides pour l'instant, à ajouter par l'utilisateur ou via le futur CMS admin.

## File Structure

```
supabase/migrations/0003_resources.sql       # table resources + RLS + contrainte de cohérence type/contenu
supabase/seed_resources.sql                  # 8 guides rédigés, un par étape existante

src/lib/resources/types.ts                   # ResourceBlock, ResourceRow, StageWithNumber
src/lib/resources/group.ts                   # groupResourcesByStage() — fonction pure
src/lib/resources/group.test.ts

src/components/resources/PrintButton.tsx     # bouton client "Télécharger en PDF" → window.print()
src/components/resources/PrintButton.test.tsx

src/app/(app)/ressources/page.tsx            # liste groupée par étape
src/app/(app)/ressources/[slug]/page.tsx     # détail d'un guide, imprimable

src/app/globals.css                          # modifié : règle @media print pour masquer les nav
src/middleware.ts                            # modifié : /ressources protégée + gate onboarding
src/components/nav/SidebarNav.tsx            # modifié : "Ressources" devient un lien actif
src/components/nav/SidebarNav.test.tsx       # modifié : nouveau test
src/components/nav/BottomNav.tsx             # modifié : "Ressources" ajouté
src/components/nav/BottomNav.test.tsx        # modifié : nouveau test
```

---

### Task 1: Schéma — table `resources`

**Files:**
- Create: `supabase/migrations/0003_resources.sql`

**Interfaces:**
- Consumes: table `stages` (Task 6 de la Fondation, déjà en place).
- Produces: table `resources` (colonnes `id, stage_id, slug, title, description, type, content_blocks, external_url, order_index, created_at`), consommée par Task 2 (seed) et Task 3 (lecture).

- [ ] **Step 1: Écrire la migration**

```sql
create table resources (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid references stages(id) on delete cascade,
  slug text not null unique,
  title text not null,
  description text not null,
  type text not null check (type in ('guide', 'lien')),
  content_blocks jsonb,
  external_url text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  constraint resources_content_matches_type check (
    (type = 'guide' and content_blocks is not null and external_url is null) or
    (type = 'lien' and external_url is not null and content_blocks is null)
  )
);

alter table resources enable row level security;

create policy "resources_select_authenticated" on resources
  for select using (auth.role() = 'authenticated');
```

- [ ] **Step 2: Vérifier avant d'appliquer — CHECKPOINT humain**

Cette étape modifie le projet Supabase réel (`virtuose-funnel`, ref `pixdukzflnjkzqyqilfy`). Avant de l'exécuter :
- Confirmer avec l'utilisateur que c'est bien le projet cible.
- Ne jamais lancer `apply_migration` sans cette confirmation explicite.

Une fois confirmé, appliquer via l'outil MCP Supabase (`apply_migration`, `project_id: pixdukzflnjkzqyqilfy`, `name: resources`).

Expected: la table `resources` existe avec sa policy (vérifiable via `list_tables`).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0003_resources.sql
git commit -m "Ajoute le schéma de la bibliothèque de ressources"
```

---

### Task 2: Seed — 8 guides rédigés

**Files:**
- Create: `supabase/seed_resources.sql`

**Interfaces:**
- Consumes: table `resources` (Task 1), table `stages` (déjà seedée avec les slugs `diagnostic`, `offre`, `cible-positionnement`, `lead-magnet`, `acquisition`, `funnel`, `conversion-relance`, `mesure-optimisation`).
- Produces: 8 lignes `resources` de type `guide`, une par étape, consommées par Task 4 et Task 5.

- [ ] **Step 1: Écrire le seed**

```sql
insert into resources (stage_id, slug, title, description, type, content_blocks, order_index)
select id, 'guide-diagnostic-funnel', 'Comprendre et lire votre Funnel Score',
  'Ce qu''il faut regarder avant de changer quoi que ce soit dans votre système de vente.',
  'guide',
  '[
    {"type": "paragraph", "text": "Avant de changer votre offre, votre site ou vos publicités, il faut savoir où se situe réellement la fuite dans votre système de vente. La plupart des entrepreneurs corrigent le mauvais problème parce qu''ils n''ont jamais mesuré les quatre zones qui déterminent leurs ventes."},
    {"type": "heading", "text": "Les 4 zones à auditer"},
    {"type": "list", "items": [
      "Trafic — Est-ce qu''assez de personnes découvrent votre offre chaque semaine ?",
      "Conversion — Parmi les visiteurs, combien deviennent des prospects (email, DM, appel) ?",
      "Offre — Votre proposition est-elle assez claire et désirable pour déclencher une décision d''achat ?",
      "Fidélisation — Vos clients reviennent-ils, ou chaque vente part-elle de zéro ?"
    ]},
    {"type": "heading", "text": "Comment lire votre Funnel Score"},
    {"type": "paragraph", "text": "Le score n''est pas une note de qualité générale : c''est un indicateur de la zone la plus faible parmi les quatre. Un score bas signifie qu''une zone tire l''ensemble vers le bas — ce n''est presque jamais les quatre en même temps."},
    {"type": "heading", "text": "Vos 3 priorités"},
    {"type": "paragraph", "text": "Une fois le diagnostic fait, ne travaillez que sur les 3 priorités qu''il vous donne, dans l''ordre. Ajouter une cinquième action en parallèle dilue l''effort et retarde les résultats mesurables."}
  ]'::jsonb,
  1
from stages where number = 1;

insert into resources (stage_id, slug, title, description, type, content_blocks, order_index)
select id, 'guide-offre-irresistible', 'Construire une offre irrésistible',
  'La méthode pour transformer votre expertise en offre claire, désirable et vendable.',
  'guide',
  '[
    {"type": "paragraph", "text": "Une offre irrésistible n''est pas la plus complète ni la moins chère : c''est celle dont la transformation promise est immédiatement comprise et désirée par la bonne personne."},
    {"type": "heading", "text": "Les 4 piliers d''une offre qui se vend"},
    {"type": "list", "items": [
      "Promesse — un résultat précis, pas une méthode (« doublez vos rendez-vous en 30 jours », pas « accompagnement marketing »)",
      "Transformation — l''état avant/après doit être visible et mesurable pour le client",
      "Preuve — un exemple concret, un chiffre, un témoignage qui rend la promesse crédible",
      "Prix — positionné par rapport à la valeur du résultat, pas par rapport à votre temps passé"
    ]},
    {"type": "heading", "text": "Erreur la plus fréquente"},
    {"type": "paragraph", "text": "Décrire ce que vous faites (« je fais du coaching », « je propose un accompagnement ») au lieu de décrire ce que le client obtient. Réécrivez votre offre en commençant par le résultat, jamais par la méthode."}
  ]'::jsonb,
  1
from stages where number = 2;

insert into resources (stage_id, slug, title, description, type, content_blocks, order_index)
select id, 'guide-cible-positionnement', 'Clarifier qui vous servez',
  'Définir précisément votre client idéal et le message qui lui parle.',
  'guide',
  '[
    {"type": "paragraph", "text": "Un message qui s''adresse à tout le monde ne convainc personne. Le positionnement commence par une décision inconfortable : accepter de ne pas convenir à tout le monde."},
    {"type": "heading", "text": "La question qui structure tout"},
    {"type": "paragraph", "text": "Qui je sers, et surtout qui je ne sers pas ? Listez 3 profils que vous refuseriez comme clients, même s''ils payaient. Ce qui reste après exclusion, c''est votre cible réelle."},
    {"type": "heading", "text": "Votre message de positionnement en une phrase"},
    {"type": "paragraph", "text": "J''aide [cible précise] à [résultat précis] sans [objection ou friction principale]. Testez cette phrase à voix haute : si elle ne se dit pas naturellement en une respiration, elle est encore trop vague."},
    {"type": "heading", "text": "Vérifier le positionnement"},
    {"type": "list", "items": [
      "Un inconnu du secteur comprend-il en 5 secondes à qui vous vous adressez ?",
      "Un client idéal se reconnaît-il immédiatement dans la description ?",
      "Le message exclut-il clairement ceux qui ne sont pas concernés ?"
    ]}
  ]'::jsonb,
  1
from stages where number = 3;

insert into resources (stage_id, slug, title, description, type, content_blocks, order_index)
select id, 'guide-lead-magnet', 'Créer un lead magnet qui capture de vrais prospects',
  'Les critères d''une ressource gratuite qui génère des contacts qualifiés, pas juste des téléchargements.',
  'guide',
  '[
    {"type": "paragraph", "text": "Un bon lead magnet ne prouve pas que vous savez beaucoup de choses : il résout un problème précis, immédiat, pour un public précis — en échange d''un email ou d''un contact."},
    {"type": "heading", "text": "Les critères d''un lead magnet efficace"},
    {"type": "list", "items": [
      "Spécifique — un seul problème, pas un aperçu général de votre expertise",
      "Rapide à consommer — 5 à 15 minutes, pas un cours complet",
      "Actionnable — la personne doit pouvoir l''utiliser tout de suite, sans vous",
      "Connecté à votre offre — sa réussite doit naturellement mener vers l''étape payante suivante"
    ]},
    {"type": "heading", "text": "Formats qui fonctionnent bien"},
    {"type": "list", "items": [
      "Checklist ou template prêt à l''emploi",
      "Diagnostic ou quiz personnalisé",
      "Script (email, appel, message de vente)",
      "Courte vidéo tutoriel"
    ]},
    {"type": "heading", "text": "Le promouvoir"},
    {"type": "paragraph", "text": "Un lead magnet caché sur votre site ne sert à rien. Créez au moins un contenu qui pointe directement dessus par canal d''acquisition actif, avec un appel à l''action explicite."}
  ]'::jsonb,
  1
from stages where number = 4;

insert into resources (stage_id, slug, title, description, type, content_blocks, order_index)
select id, 'guide-premier-canal-acquisition', 'Lancer un canal d''acquisition qui tient dans la durée',
  'Pourquoi choisir un seul canal au départ, et comment le rendre régulier.',
  'guide',
  '[
    {"type": "paragraph", "text": "La plupart des entrepreneurs dispersent leur énergie sur plusieurs canaux à la fois et n''en maîtrisent aucun. Un seul canal, travaillé avec régularité pendant 90 jours, produit plus de résultats que cinq canaux touchés une fois par semaine chacun."},
    {"type": "heading", "text": "Choisir votre canal"},
    {"type": "paragraph", "text": "Posez-vous une seule question : où votre cible passe-t-elle déjà du temps à chercher une solution à son problème ? Ce n''est pas une question de préférence personnelle pour un réseau social."},
    {"type": "heading", "text": "Le principe de régularité"},
    {"type": "paragraph", "text": "Un algorithme ou un réseau de recommandation récompense la fréquence avant la perfection. Une publication moyenne chaque semaine bat une publication parfaite chaque trimestre."},
    {"type": "heading", "text": "3 types de contenu qui génèrent des leads"},
    {"type": "list", "items": [
      "Preuve — résultats clients, avant/après, chiffres",
      "Éducation — une erreur fréquente de votre cible et comment l''éviter",
      "Invitation — un appel direct à essayer votre lead magnet ou votre offre"
    ]}
  ]'::jsonb,
  1
from stages where number = 5;

insert into resources (stage_id, slug, title, description, type, content_blocks, order_index)
select id, 'guide-page-de-vente', 'Structurer une page de vente qui convertit',
  'Les sections indispensables, dans l''ordre, pour transformer un visiteur en client.',
  'guide',
  '[
    {"type": "paragraph", "text": "Une page de vente n''est pas une brochure : c''est une conversation écrite qui répond, dans l''ordre, aux objections que votre visiteur se pose avant de sortir sa carte bancaire."},
    {"type": "heading", "text": "La structure qui fonctionne"},
    {"type": "list", "items": [
      "Accroche — le résultat promis, en une phrase, avant tout le reste",
      "Problème — décrire la situation actuelle du visiteur pour qu''il se reconnaisse",
      "Solution — votre offre, présentée comme le chemin vers le résultat",
      "Preuve — témoignages, résultats chiffrés, exemples concrets",
      "Détail de l''offre — ce qui est inclus, clairement listé",
      "Appel à l''action — un bouton unique et répété, pas dix choix différents",
      "Garantie et FAQ — lever les dernières objections avant la sortie"
    ]},
    {"type": "heading", "text": "Erreur à éviter"},
    {"type": "paragraph", "text": "Ne mettez jamais l''appel à l''action seulement en bas de page. Un visiteur prêt à acheter dès l''accroche doit pouvoir le faire immédiatement, sans scroller."}
  ]'::jsonb,
  1
from stages where number = 6;

insert into resources (stage_id, slug, title, description, type, content_blocks, order_index)
select id, 'guide-sequence-relance', 'Mettre en place une relance qui convertit sans forcer',
  'Une séquence de 3 messages pour récupérer les prospects qui n''ont pas encore acheté.',
  'guide',
  '[
    {"type": "paragraph", "text": "La majorité des ventes ne se font pas au premier contact. Sans relance, vous perdez silencieusement la plupart des prospects qui étaient pourtant intéressés."},
    {"type": "heading", "text": "La séquence en 3 messages"},
    {"type": "list", "items": [
      "Message 1 (J+1) — rappel simple de l''offre, sans pression, en réaffirmant le résultat promis",
      "Message 2 (J+3) — traiter l''objection la plus fréquente que vous recevez habituellement",
      "Message 3 (J+7) — dernier rappel avec une raison d''agir maintenant (place limitée, tarif qui évolue — uniquement si c''est vrai)"
    ]},
    {"type": "heading", "text": "Le ton à adopter"},
    {"type": "paragraph", "text": "Chaque message doit apporter quelque chose de nouveau — une réponse, une preuve, une clarification — jamais seulement « vous avez vu mon offre ? ». Une relance qui n''apporte rien est ignorée, à raison."}
  ]'::jsonb,
  1
from stages where number = 7;

insert into resources (stage_id, slug, title, description, type, content_blocks, order_index)
select id, 'guide-suivi-metriques-cles', 'Suivre les métriques qui comptent vraiment',
  'Le rituel hebdomadaire pour piloter votre système de vente au lieu de le subir.',
  'guide',
  '[
    {"type": "paragraph", "text": "On ne peut pas améliorer ce qu''on ne mesure pas. Mais suivre vingt indicateurs revient à n''en suivre aucun : concentrez-vous sur les trois qui pilotent réellement votre activité."},
    {"type": "heading", "text": "Les 3 métriques clés"},
    {"type": "list", "items": [
      "Nombre de nouveaux leads par semaine",
      "Taux de conversion lead → client",
      "Revenu généré sur la période"
    ]},
    {"type": "heading", "text": "Le rituel hebdomadaire"},
    {"type": "paragraph", "text": "Chaque semaine, à heure fixe, notez ces trois chiffres. Comparez-les à la semaine précédente. Une baisse sur une métrique vous indique exactement où revenir dans les étapes précédentes de votre Parcours."},
    {"type": "heading", "text": "Ce qu''il ne faut pas faire"},
    {"type": "paragraph", "text": "Changer plusieurs choses en même temps (offre, canal, prix) rend impossible de savoir ce qui a réellement fait varier vos résultats. Une variable à la fois, mesurée sur au moins deux semaines."}
  ]'::jsonb,
  1
from stages where number = 8;
```

- [ ] **Step 2: Vérifier avant d'appliquer — CHECKPOINT humain**

Même projet Supabase réel que Task 1. Confirmer avec l'utilisateur avant d'exécuter, puis appliquer via l'outil MCP Supabase (`execute_sql`, `project_id: pixdukzflnjkzqyqilfy`).

Expected: `select count(*) from resources;` retourne 8.

- [ ] **Step 3: Commit**

```bash
git add supabase/seed_resources.sql
git commit -m "Ajoute le contenu des 8 guides de la bibliothèque de ressources"
```

---

### Task 3: Fonction pure de regroupement par étape

**Files:**
- Create: `src/lib/resources/types.ts`
- Create: `src/lib/resources/group.ts`
- Test: `src/lib/resources/group.test.ts`

**Interfaces:**
- Consumes: rien (types purs).
- Produces: `groupResourcesByStage(resources: ResourceRow[], stages: StageWithNumber[]): ResourceGroup[]`, consommée par Task 4 (page liste).

- [ ] **Step 1: Écrire les types**

```typescript
// src/lib/resources/types.ts
export interface ResourceBlock {
  type: "paragraph" | "heading" | "list";
  text?: string;
  items?: string[];
}

export interface ResourceRow {
  id: string;
  stage_id: string | null;
  slug: string;
  title: string;
  description: string;
  type: "guide" | "lien";
  content_blocks: ResourceBlock[] | null;
  external_url: string | null;
  order_index: number;
}

export interface StageWithNumber {
  id: string;
  number: number;
  title: string;
}

export interface ResourceGroup {
  stageId: string | null;
  stageLabel: string;
  stageNumber: number | null;
  resources: ResourceRow[];
}
```

- [ ] **Step 2: Écrire le test qui échoue**

```typescript
// src/lib/resources/group.test.ts
import { describe, it, expect } from "vitest";
import { groupResourcesByStage } from "./group";
import type { ResourceRow, StageWithNumber } from "./types";

const stages: StageWithNumber[] = [
  { id: "stage-2", number: 2, title: "Offre" },
  { id: "stage-1", number: 1, title: "Diagnostic" },
];

function makeResource(overrides: Partial<ResourceRow>): ResourceRow {
  return {
    id: "id",
    stage_id: null,
    slug: "slug",
    title: "Titre",
    description: "Description",
    type: "guide",
    content_blocks: [],
    external_url: null,
    order_index: 0,
    ...overrides,
  };
}

describe("groupResourcesByStage", () => {
  it("trie les groupes par numéro d'étape croissant, pas par ordre d'insertion", () => {
    const resources = [
      makeResource({ id: "r-offre", stage_id: "stage-2", order_index: 1 }),
      makeResource({ id: "r-diagnostic", stage_id: "stage-1", order_index: 1 }),
    ];

    const groups = groupResourcesByStage(resources, stages);

    expect(groups.map((g) => g.stageNumber)).toEqual([1, 2]);
  });

  it("place les ressources sans étape dans un groupe « Ressources générales » en tête", () => {
    const resources = [
      makeResource({ id: "r-generale", stage_id: null, order_index: 1 }),
      makeResource({ id: "r-diagnostic", stage_id: "stage-1", order_index: 1 }),
    ];

    const groups = groupResourcesByStage(resources, stages);

    expect(groups[0].stageLabel).toBe("Ressources générales");
    expect(groups[0].resources.map((r) => r.id)).toEqual(["r-generale"]);
  });

  it("omet le groupe général quand il n'y a aucune ressource sans étape", () => {
    const resources = [makeResource({ id: "r-diagnostic", stage_id: "stage-1" })];

    const groups = groupResourcesByStage(resources, stages);

    expect(groups.some((g) => g.stageId === null)).toBe(false);
  });

  it("trie les ressources d'un même groupe par order_index", () => {
    const resources = [
      makeResource({ id: "second", stage_id: "stage-1", order_index: 2 }),
      makeResource({ id: "first", stage_id: "stage-1", order_index: 1 }),
    ];

    const groups = groupResourcesByStage(resources, stages);

    expect(groups[0].resources.map((r) => r.id)).toEqual(["first", "second"]);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- src/lib/resources/group.test.ts`
Expected: FAIL — `group.ts` n'existe pas encore.

- [ ] **Step 4: Écrire l'implémentation minimale**

```typescript
// src/lib/resources/group.ts
import type { ResourceGroup, ResourceRow, StageWithNumber } from "./types";

export function groupResourcesByStage(
  resources: ResourceRow[],
  stages: StageWithNumber[]
): ResourceGroup[] {
  const stageById = new Map(stages.map((stage) => [stage.id, stage]));
  const groups = new Map<string, ResourceGroup>();

  const generalGroup: ResourceGroup = {
    stageId: null,
    stageLabel: "Ressources générales",
    stageNumber: null,
    resources: [],
  };

  for (const resource of resources) {
    if (resource.stage_id === null) {
      generalGroup.resources.push(resource);
      continue;
    }

    const key = resource.stage_id;
    if (!groups.has(key)) {
      const stage = stageById.get(key);
      groups.set(key, {
        stageId: key,
        stageLabel: stage ? `${String(stage.number).padStart(2, "0")} ${stage.title}` : "Étape inconnue",
        stageNumber: stage?.number ?? null,
        resources: [],
      });
    }
    groups.get(key)!.resources.push(resource);
  }

  const sortByOrderIndex = (a: ResourceRow, b: ResourceRow) => a.order_index - b.order_index;
  generalGroup.resources.sort(sortByOrderIndex);
  for (const group of groups.values()) {
    group.resources.sort(sortByOrderIndex);
  }

  const orderedStageGroups = Array.from(groups.values()).sort(
    (a, b) => (a.stageNumber ?? 0) - (b.stageNumber ?? 0)
  );

  return generalGroup.resources.length > 0 ? [generalGroup, ...orderedStageGroups] : orderedStageGroups;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- src/lib/resources/group.test.ts`
Expected: PASS — 4 tests.

- [ ] **Step 6: Commit**

```bash
git add src/lib/resources/types.ts src/lib/resources/group.ts src/lib/resources/group.test.ts
git commit -m "Ajoute la fonction pure de regroupement des ressources par étape"
```

---

### Task 4: Bouton d'impression

**Files:**
- Create: `src/components/resources/PrintButton.tsx`
- Test: `src/components/resources/PrintButton.test.tsx`

**Interfaces:**
- Consumes: rien.
- Produces: composant `PrintButton` (sans props), consommé par Task 6 (page détail).

- [ ] **Step 1: Écrire le test qui échoue**

```typescript
// src/components/resources/PrintButton.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { PrintButton } from "./PrintButton";

describe("PrintButton", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("déclenche l'impression du navigateur au clic", () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});

    render(<PrintButton />);
    fireEvent.click(screen.getByRole("button", { name: "Télécharger en PDF" }));

    expect(printSpy).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/components/resources/PrintButton.test.tsx`
Expected: FAIL — `PrintButton.tsx` n'existe pas encore.

- [ ] **Step 3: Écrire l'implémentation minimale**

```typescript
// src/components/resources/PrintButton.tsx
"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg border border-dark/12 px-4 py-2 text-sm font-semibold text-dark hover:bg-paper"
    >
      Télécharger en PDF
    </button>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/components/resources/PrintButton.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/resources/PrintButton.tsx src/components/resources/PrintButton.test.tsx
git commit -m "Ajoute le bouton d'impression des guides"
```

---

### Task 5: Page liste `/ressources`

**Files:**
- Create: `src/app/(app)/ressources/page.tsx`

**Interfaces:**
- Consumes: `groupResourcesByStage` (Task 3), `createClient` de `@/lib/supabase/server`, composants `Card`/`Badge` existants.
- Produces: route `/ressources`, dont les liens de type `guide` pointent vers `/ressources/[slug]` (Task 6).

- [ ] **Step 1: Écrire la page**

```typescript
// src/app/(app)/ressources/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { groupResourcesByStage } from "@/lib/resources/group";
import type { ResourceRow, StageWithNumber } from "@/lib/resources/types";

export default async function ResourcesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: stages } = await supabase
    .from("stages")
    .select("id, number, title")
    .order("order_index");

  const { data: resources } = await supabase
    .from("resources")
    .select("id, stage_id, slug, title, description, type, content_blocks, external_url, order_index")
    .order("order_index");

  const groups = groupResourcesByStage(
    (resources ?? []) as ResourceRow[],
    (stages ?? []) as StageWithNumber[]
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="t-display-mid text-3xl text-dark">Ressources</h1>
      <p className="mb-8 text-secondary">
        Guides pratiques et liens utiles pour chaque étape de votre parcours.
      </p>

      {groups.map((group) => (
        <div key={group.stageId ?? "general"} className="mb-8">
          <p className="t-meta mb-3 text-xs uppercase tracking-widest text-secondary">
            {group.stageLabel}
          </p>
          <Card>
            <ol className="flex flex-col gap-4">
              {group.resources.map((resource) => (
                <li
                  key={resource.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-dark/5 pb-4 last:border-none last:pb-0"
                >
                  <div>
                    <p className="font-semibold text-dark">{resource.title}</p>
                    <p className="text-sm text-secondary">{resource.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone="default">{resource.type === "guide" ? "Guide" : "Lien"}</Badge>
                    {resource.type === "guide" ? (
                      <Link
                        href={`/ressources/${resource.slug}`}
                        className="text-sm font-semibold text-ochre hover:underline"
                      >
                        Ouvrir →
                      </Link>
                    ) : (
                      <a
                        href={resource.external_url ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-ochre hover:underline"
                      >
                        Ouvrir →
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Vérification manuelle**

Cette page se vérifie au Task 8 (checklist manuelle finale), une fois la navigation activée (Task 9) — pas de test unitaire pour une page serveur qui ne fait qu'assembler des données (cohérent avec `dashboard/page.tsx` et `coach/page.tsx`, non testés directement dans ce projet).

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/ressources/page.tsx"
git commit -m "Ajoute la page liste des ressources groupées par étape"
```

---

### Task 6: Page détail `/ressources/[slug]`

**Files:**
- Create: `src/app/(app)/ressources/[slug]/page.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `PrintButton` (Task 4), `createClient`.
- Produces: route `/ressources/[slug]`, avec mise en page imprimable.

- [ ] **Step 1: Écrire la page**

```typescript
// src/app/(app)/ressources/[slug]/page.tsx
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "@/components/resources/PrintButton";
import type { ResourceBlock } from "@/lib/resources/types";

export default async function ResourceDetailPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: resource } = await supabase
    .from("resources")
    .select("title, description, type, content_blocks")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!resource || resource.type !== "guide") {
    notFound();
  }

  const blocks = (resource.content_blocks ?? []) as ResourceBlock[];

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href="/ressources"
        className="text-sm font-medium text-ochre hover:underline print:hidden"
      >
        ← Toutes les ressources
      </Link>
      <h1 className="t-display-mid mt-4 text-3xl text-dark">{resource.title}</h1>
      <p className="mb-8 text-secondary">{resource.description}</p>

      <div className="flex flex-col gap-4">
        {blocks.map((block, index) => {
          if (block.type === "heading") {
            return (
              <h2 key={index} className="t-display-mid mt-4 text-xl text-dark">
                {block.text}
              </h2>
            );
          }
          if (block.type === "list") {
            return (
              <ul key={index} className="flex flex-col gap-2">
                {(block.items ?? []).map((item, itemIndex) => (
                  <li key={itemIndex} className="border-l-2 border-ochre/40 pl-3 text-dark">
                    {item}
                  </li>
                ))}
              </ul>
            );
          }
          return (
            <p key={index} className="text-dark">
              {block.text}
            </p>
          );
        })}
      </div>

      <div className="mt-10 print:hidden">
        <PrintButton />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Ajouter la règle d'impression**

Ajouter à la fin de `src/app/globals.css` :

```css
/* Bouton "Télécharger en PDF" (guides) : la sidebar/bottom nav ne doit
   jamais apparaître dans l'impression, seul le contenu du guide compte. */
@media print {
  nav {
    display: none !important;
  }
}
```

- [ ] **Step 3: Vérification manuelle**

Comme la Task 5, se vérifie au Task 8 — pas de test unitaire pour cette page serveur (le comportement du bouton est déjà couvert par `PrintButton.test.tsx`).

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/ressources/[slug]/page.tsx" src/app/globals.css
git commit -m "Ajoute la page détail d'un guide, imprimable en PDF"
```

---

### Task 7: Protéger `/ressources` dans le middleware

**Files:**
- Modify: `src/middleware.ts`

**Interfaces:**
- Consumes: rien de nouveau.
- Produces: `/ressources` redirige vers `/login` si non connecté, vers `/onboarding` si l'onboarding n'est pas complété — même comportement que `/dashboard`, `/diagnostic`, `/missions`.

- [ ] **Step 1: Modifier `APP_ROUTES` et la vérification d'onboarding**

Dans `src/middleware.ts`, remplacer :

```typescript
const APP_ROUTES = ["/dashboard", "/onboarding", "/diagnostic", "/missions", "/coach"];
```

par :

```typescript
const APP_ROUTES = ["/dashboard", "/onboarding", "/diagnostic", "/missions", "/coach", "/ressources"];
```

Et remplacer :

```typescript
  if (
    user &&
    (pathname.startsWith("/diagnostic") ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/missions"))
  ) {
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
```

- [ ] **Step 2: Ajouter la route au matcher**

Remplacer :

```typescript
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/diagnostic/:path*",
    "/missions/:path*",
    "/coach/:path*",
    "/login",
    "/signup",
  ],
};
```

par :

```typescript
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/diagnostic/:path*",
    "/missions/:path*",
    "/coach/:path*",
    "/ressources/:path*",
    "/login",
    "/signup",
  ],
};
```

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "Protège /ressources et applique le gate d'onboarding"
```

---

### Task 8: Activer "Ressources" dans la navigation

**Files:**
- Modify: `src/components/nav/SidebarNav.tsx`
- Modify: `src/components/nav/SidebarNav.test.tsx`
- Modify: `src/components/nav/BottomNav.tsx`
- Modify: `src/components/nav/BottomNav.test.tsx`

**Interfaces:**
- Consumes: rien de nouveau.
- Produces: lien "Ressources" actif dans les deux navigations, vers `/ressources`.

- [ ] **Step 1: Écrire les tests qui échouent**

Ajouter à `src/components/nav/SidebarNav.test.tsx` :

```typescript
  it("affiche Ressources comme lien actif, plus dans les sections à venir", () => {
    render(<SidebarNav role="participant" />);
    expect(screen.getByRole("link", { name: "Ressources" })).toHaveAttribute("href", "/ressources");
  });
```

Ajouter à `src/components/nav/BottomNav.test.tsx` :

```typescript
  it("affiche Ressources", () => {
    render(<BottomNav role="participant" />);
    expect(screen.getByRole("link", { name: "Ressources" })).toHaveAttribute("href", "/ressources");
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- src/components/nav`
Expected: FAIL sur les deux nouveaux tests — "Ressources" n'est pas encore un lien.

- [ ] **Step 3: Modifier `SidebarNav.tsx`**

Remplacer :

```typescript
const BASE_ITEMS: NavLinkItem[] = [
  { href: "/dashboard", label: "Mon Parcours" },
  { href: "/diagnostic", label: "Diagnostic" },
];

const COACH_ITEM: NavLinkItem = { href: "/coach", label: "Coach" };

const COMING_SOON_LABELS = ["Virtuose AI", "Ressources", "Communauté"];
```

par :

```typescript
const BASE_ITEMS: NavLinkItem[] = [
  { href: "/dashboard", label: "Mon Parcours" },
  { href: "/diagnostic", label: "Diagnostic" },
  { href: "/ressources", label: "Ressources" },
];

const COACH_ITEM: NavLinkItem = { href: "/coach", label: "Coach" };

const COMING_SOON_LABELS = ["Virtuose AI", "Communauté"];
```

- [ ] **Step 4: Modifier `BottomNav.tsx`**

Remplacer :

```typescript
const BASE_ITEMS: NavLinkItem[] = [
  { href: "/dashboard", label: "Accueil" },
  { href: "/diagnostic", label: "Diagnostic" },
];
```

par :

```typescript
const BASE_ITEMS: NavLinkItem[] = [
  { href: "/dashboard", label: "Accueil" },
  { href: "/diagnostic", label: "Diagnostic" },
  { href: "/ressources", label: "Ressources" },
];
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test -- src/components/nav`
Expected: PASS — tous les tests, y compris les 2 nouveaux.

- [ ] **Step 6: Commit**

```bash
git add src/components/nav/SidebarNav.tsx src/components/nav/SidebarNav.test.tsx src/components/nav/BottomNav.tsx src/components/nav/BottomNav.test.tsx
git commit -m "Active Ressources dans la navigation"
```

---

### Task 9: Vérification finale

Avec les migrations et le seed appliqués (Tasks 1–2) et `npm run dev` lancé :

- [ ] Se connecter avec un compte participant dont l'onboarding est complété.
- [ ] Cliquer "Ressources" dans la sidebar → la page liste affiche 8 groupes (un par étape), chacun avec une carte "Guide".
- [ ] Ouvrir un guide → le contenu s'affiche (titres, paragraphes, listes), lisible.
- [ ] Cliquer "Télécharger en PDF" → la boîte de dialogue d'impression du navigateur s'ouvre, sans la sidebar ni le bouton visibles dans l'aperçu.
- [ ] Retour "← Toutes les ressources" fonctionne.
- [ ] Sur mobile (largeur réduite), "Ressources" apparaît dans la barre du bas.
- [ ] `npm run test`, `npm run lint`, `npm run build` passent tous.
- [ ] Commit final si des ajustements ont été faits pendant la vérification.

---

## Self-Review

**Couverture du scope validé :** types guide/lien ✓ (Task 1), regroupement par étape ✓ (Task 3), page liste ✓ (Task 5), page détail + impression ✓ (Task 4, 6), navigation activée ✓ (Task 8), route protégée ✓ (Task 7), contenu des 8 guides rédigé par l'agent, aucun lien externe fictif ✓ (Task 2, Scope note).

**Hors scope explicitement noté :** recherche/filtres, catégories multiples, difficulté/temps estimé, interface d'ajout (CMS admin) — cohérent avec la Scope note.

**Cohérence des types :** `ResourceRow`, `ResourceBlock`, `StageWithNumber`, `ResourceGroup` définis une seule fois dans `src/lib/resources/types.ts` (Task 3) et réutilisés tels quels dans les Tasks 5 et 6, aucune redéfinition divergente.
