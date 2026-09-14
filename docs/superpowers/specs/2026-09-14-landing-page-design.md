# Landing page publique — Design

> Sous-projet 2 (après la Fondation, PR #1) du spec global `docs/superpowers/specs/2026-09-13-virtuose-funnel-platform.md`, section 30. Remplace le placeholder minimal actuel de `src/app/page.tsx` (hero seul, sans les autres sections). Motivé par un retour direct du membre : la page d'accueil actuelle est "trop fade".

## Contexte

Le placeholder livré avec la Fondation est volontairement minimal (un hero centré, un CTA). Aucune des 13 sections du spec §30 n'existe encore. Aucun contenu réel (témoignages, prix, captures) n'est disponible — seul le produit lui-même (auth, onboarding, diagnostic, dashboard "Mon Parcours") existe réellement, avec les 8 étapes et leurs missions phares déjà en base (seed).

## Décisions validées avec le membre

- **Contenu sans donnée réelle** (témoignages, prix) : affiché quand même, mais toujours avec un badge "Exemple" visible — jamais présenté comme réel. Pas de faux nom de personne qui pourrait passer pour une vraie personne ; utiliser "Prénom, activité" générique.
- **Ton visuel** : hero en fond navy foncé (`bg-navy`), sections suivantes en fond clair (`bg-soft`/blanc) avec le navy et le bleu en accents, deux ruptures de rythme en navy foncé au milieu de la page (Aperçu plateforme, Virtuose AI) pour casser la monotonie d'une longue page claire.
- **Aperçu plateforme** : représentation stylisée du vrai dashboard "Mon Parcours" (barre de progression, mission en cours, liste des 8 étapes) — pas une capture d'écran brute, une reconstitution simplifiée aux couleurs de la marque, mais basée sur le produit réel, pas une image inventée.
- **Portée** : les 13 sections du spec §30 en une seule fois (pas de découpage en plusieurs pages/plans), car le contenu de chacune tient dans le code sans dépendance externe.

## Architecture

```
src/components/marketing/
  Section.tsx           # wrapper transverse : max-width, padding vertical, tone="dark"|"light"
  Hero.tsx
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
  Faq.tsx
  CtaFinal.tsx

src/app/page.tsx         # assemble les 13 sections dans l'ordre, remplace le placeholder actuel
```

Chaque section est un composant autonome, sans état partagé avec les autres (à l'exception de `Faq.tsx` qui a son propre état local d'accordéon). Réutilisation du design system existant (`Button`, `Card`, `Badge`) partout où c'est naturel — pas de nouveaux composants génériques créés pour cette page au-delà de `Section` (wrapper de mise en page) et d'un petit composant `ExempleBadge` (le badge "Exemple" réutilisé sur Résultats/Témoignages/Pricing).

Pas de nouvelle dépendance externe (pas de librairie d'accordéon, de carrousel ou d'icônes) — icônes simples en SVG inline ou emoji sobres si besoin, cohérent avec la contrainte "zero-dependency" implicite du reste du projet.

## Sections — contenu et comportement

### 1. Hero (`tone="dark"`)
- Kicker "VIRTUOSE FUNNEL", titre "Transformez votre audience en système de vente.", sous-texte "Un programme d'accompagnement guidé pour construire, lancer et optimiser votre système d'acquisition et de conversion." (texte exact spec §30).
- CTA primaire → `/signup` ("Construire mon système de vente"), secondaire → ancre `#comment-ca-marche` ("Découvrir le programme").
- Élément visuel : frise de 8 pastilles numérotées (dégradé `royal`→`electric`, cohérent avec la palette Virtuose Funnel — pas de couleur or/dorée, qui appartenait à l'ancienne identité DigitalStartGo Elite), à droite du texte en desktop (`sm:flex-row`), sous le texte en mobile.
- Conserve le lien existant "Déjà un compte ? Se connecter" → `/login` (ajouté au Plan Fondation).

### 2. Problème (`tone="light"`)
- Titre : "La plupart des entrepreneurs n'ont pas un problème de trafic. Ils ont un problème de système."
- 4 `Card` courtes : offre floue, audience sans funnel, prospects qui ne convertissent jamais, aucune mesure de ce qui marche.

### 3. Transformation (`tone="light"`)
- Deux colonnes "Avant" / "Après" : dispersé/deviner/poster au hasard vs. système structuré/actions guidées/résultats mesurés.

### 4. Comment ça marche (`tone="light"`, ancre `#comment-ca-marche`)
- 4 étapes macro en ligne (desktop) / colonne (mobile) : Diagnostiquez → Suivez le parcours guidé → Soumettez et recevez un feedback coach → Lancez et mesurez.

### 5. Les 8 étapes (`tone="light"`)
- Grille de 8 `Card`, contenu réel tiré du seed déjà en base (`supabase/seed.sql` : Diagnostic, Offre, Cible & Positionnement, Lead Magnet, Acquisition, Mon Funnel, Conversion & Relance, Mesure & Optimisation) — ces 8 titres/objectifs sont dupliqués en dur dans ce composant (pas de fetch Supabase depuis une page publique statique) pour rester un contenu marketing statique, sans dépendance à la base au build.
- Carte 1 (Diagnostic) porte un `Badge` "Commencez ici" et un lien direct vers `/signup`.

### 6. Aperçu plateforme (`tone="dark"`)
- Reconstitution simplifiée du dashboard réel : `ProgressBar` (design system) à ~0%, une carte "Mission 1" avec `Badge` "À faire", une liste des 8 étapes avec badges de statut — mêmes composants que ceux réellement utilisés dans `/dashboard`, pas une image.
- Légende : "Voici à quoi ressemble votre tableau de bord dès votre premier jour."

### 7. Coaching (`tone="light"`)
- Titre : "Un humain valide chaque étape de votre progression."
- 3 points illustrés (icônes SVG simples) : "Vous soumettez", "Votre coach corrige", "Vous avancez avec confiance".

### 8. Virtuose AI (`tone="dark"`)
- 4 bulles de conversation stylisées avec des prompts réels du spec §16 ("Analyse mon offre", "Donne-moi 10 hooks", "Pourquoi mon funnel ne convertit pas ?", "Écris ma séquence email").
- Mention discrète "Disponible dans le programme" — pas de détail technique, l'IA n'est pas encore construite (plan séparé).

### 9. Résultats (`tone="light"`)
- Bandeau de 4 métriques (`Leads`, `Taux de conversion`, `Ventes`, `Revenu`) avec `ExempleBadge` sur l'ensemble du bandeau.

### 10. Témoignages (`tone="light"`)
- 3 `Card` avec `ExempleBadge`, nom générique "Prénom, activité" (ex. "Awa, coach business"), citation courte + résultat évoqué.

### 11. Pricing (`tone="light"`)
- 3 `Card` STARTER / PRO / ELITE, PRO visuellement mis en avant (bordure `border-royal`), `ExempleBadge` sur les prix, 3-4 bénéfices par palier, CTA de chaque carte → `/signup`.

### 12. FAQ (`tone="light"`)
- Composant client (`"use client"`) avec état local `openIndex: number | null`. 5-6 questions (durée du programme, besoin d'audience, fonctionnement du coaching, annulation, niveau débutant). Un item ouvert à la fois (accordéon simple), toggle au clic.

### 13. CTA final (`tone="dark"`)
- Reprend "Construisez votre système de vente. Lancez-le. Optimisez-le." + CTA → `/signup`.

## Composants transverses

**`Section.tsx`**
```ts
interface SectionProps {
  tone: "dark" | "light";
  id?: string;
  children: React.ReactNode;
}
```
Applique `bg-navy text-white` ou `bg-soft text-dark`, un conteneur `max-w-5xl mx-auto px-6 py-20` (ajustable), et l'`id` pour les ancres internes (`#comment-ca-marche`).

**`ExempleBadge.tsx`** — petit composant qui rend `<Badge tone="warning">Exemple</Badge>` (ou équivalent), centralisé pour ne pas répéter le même badge à 3 endroits avec un texte légèrement différent par erreur.

## Tests

Une page marketing n'a pas de logique métier complexe — la seule logique réelle est l'accordéon FAQ. Tests prévus (Vitest + Testing Library, pattern déjà en place) :
- `Faq.test.tsx` : un item fermé par défaut s'ouvre au clic ; cliquer un second item ferme le premier (comportement accordéon un-seul-ouvert) ; re-cliquer l'item ouvert le referme.
- `Hero.test.tsx` : le CTA principal a bien `href="/signup"`, le lien secondaire a bien `href="/login"`.
- Pas de test dédié pour les sections purement statiques (Problème, Transformation, etc.) — rien à vérifier au-delà du rendu, qui est déjà couvert par `npm run build` (compilation) et une vérification visuelle manuelle.

## Hors scope (rappel)

- Aucune vraie donnée de pricing/paiement (spec §31, phase ultérieure).
- Aucune vraie intégration Virtuose AI (spec §16, plan séparé).
- Aucun vrai témoignage client (à remplacer dès que disponible — remplacement trivial, un seul fichier `Temoignages.tsx`).
- Pas de CMS pour éditer ce contenu (spec §32, phase ultérieure) — édition par code uniquement pour l'instant, cohérent avec la décision prise pendant le brainstorming.
