-- Migration 0018 : Missions guidées étape 5 « Acquisition » — 5.1, 5.2, 5.3
-- Les textes utilisent la syntaxe $txt$ ... $txt$ : aucune apostrophe ni
-- guillemet à échapper, le JSON reste lisible tel quel.
-- ============================================================

-- 1. Passer l'ancienne mission de l'étape 5 à inactive
UPDATE missions SET active = false, ordre = 0
WHERE number = 5
  AND stage_id = (SELECT id FROM stages WHERE number = 5);

-- 2. Mission 5.1 — Choisir votre canal principal
INSERT INTO missions (stage_id, code, number, order_index, title, objective, estimated_duration_minutes, ordre, active, pourquoi, exemple_avant, exemple_apres, champs, criteres)
VALUES (
  (SELECT id FROM stages WHERE number = 5),
  '5.1', 5, 1,
  $txt$Choisir votre canal principal$txt$,
  $txt$Un seul canal principal, choisi là où se trouve votre client idéal, rapporte plus que cinq réseaux abandonnés.$txt$,
  20, 1, true,
  $txt$Être partout, c'est n'être efficace nulle part. Un seul canal principal, choisi là où se trouve votre client idéal et tenable avec votre temps, rapporte plus que cinq réseaux abandonnés au bout de deux semaines.$txt$,
  $txt$« Je vais poster sur Facebook, Instagram, TikTok et LinkedIn. »$txt$,
  $txt$« TikTok, parce que mes couturières y passent leurs soirées (mission 3.1). 3 vidéos par semaine, 4 h au total. Pas de budget pub pour l'instant. »$txt$,
  $txt$[
    {"cle":"canal","libelle":"Votre canal principal","type":"choix","obligatoire":true,"options":["Facebook","Instagram","TikTok","LinkedIn","Groupes WhatsApp ou Facebook","Partenariats","Publicité payante","Autre"]},
    {"cle":"pourquoi_canal","libelle":"Pourquoi ce canal ?","type":"texte_long","obligatoire":true,"aide":"Reliez-le à l'endroit où se trouve votre client idéal.","prerempli_depuis":{"mission":"3.1","cle":"ou_la_trouver"}},
    {"cle":"temps_semaine","libelle":"Temps que vous y consacrez par semaine","type":"texte","obligatoire":true},
    {"cle":"budget_pub","libelle":"Budget publicité par mois (FCFA, 0 si aucun)","type":"nombre","obligatoire":true}
  ]$txt$,
  $txt$[
    "Le canal est celui où se trouve le client idéal décrit à l'étape 3.",
    "Le rythme est tenable avec le temps disponible (mission 1.2).",
    "Un seul canal principal."
  ]$txt$
);

-- 3. Mission 5.2 — Préparer 2 semaines de publications
INSERT INTO missions (stage_id, code, number, order_index, title, objective, estimated_duration_minutes, ordre, active, pourquoi, exemple_avant, exemple_apres, champs, criteres)
VALUES (
  (SELECT id FROM stages WHERE number = 5),
  '5.2', 5, 2,
  $txt$Préparer 2 semaines de publications$txt$,
  $txt$Un plan de 2 semaines avec un objectif pour chaque publication vous fait tenir le rythme.$txt$,
  40, 2, true,
  $txt$Publier « quand on a une idée » mène au silence au bout d'une semaine. Un plan de 2 semaines, avec un objectif pour chaque publication, vous fait tenir le rythme, et chaque publication amène des contacts vers votre lead magnet.$txt$,
  $txt$« Je publierai des conseils quand j'aurai le temps. »$txt$,
  $txt$« Lundi : vidéo "3 erreurs qui font fuir vos clientes" → lien vers la checklist. Mercredi : avant/après du catalogue d'une cliente (preuve). Vendredi : réponse à la question "Pourquoi on me demande le prix puis plus rien ?" → "Écrivez ATELIER". »$txt$,
  $txt$[
    {"cle":"themes","libelle":"Vos 3 thèmes principaux","type":"liste","obligatoire":true,"min_lignes":3,"max_lignes":3,"aide":"Tirés des frustrations de votre client idéal."},
    {"cle":"publications","libelle":"Vos publications des 2 prochaines semaines","type":"liste","obligatoire":true,"min_lignes":6,"max_lignes":10,"aide":"Pour chacune : jour, format, sujet, et ce que la personne doit faire ensuite."},
    {"cle":"rythme","libelle":"Votre rythme de publication","type":"texte","obligatoire":true}
  ]$txt$,
  $txt$[
    "Chaque publication mène au lead magnet ou à une conversation.",
    "Le plan mélange éduquer, prouver et proposer.",
    "Le rythme est tenable."
  ]$txt$
);

-- 4. Mission 5.3 — Publier et mesurer pendant 2 semaines
INSERT INTO missions (stage_id, code, number, order_index, title, objective, estimated_duration_minutes, ordre, active, pourquoi, exemple_avant, exemple_apres, champs, criteres)
VALUES (
  (SELECT id FROM stages WHERE number = 5),
  '5.3', 5, 3,
  $txt$Publier et mesurer pendant 2 semaines$txt$,
  $txt$Après 2 semaines, vos chiffres vous disent quoi garder et quoi changer.$txt$,
  20, 3, true,
  $txt$C'est sur le terrain qu'on apprend ce qui marche. Après 2 semaines, vos chiffres vous disent quoi garder et quoi changer. Sans eux, vous continueriez à l'aveugle.$txt$,
  $txt$« J'ai publié, mais je ne sais pas si ça marche. »$txt$,
  $txt$« 6 vidéos publiées, 4 200 vues au total, 11 nouveaux contacts. La vidéo "3 erreurs" a fait 60 % des contacts : je fais 2 vidéos "erreurs" par semaine, et j'arrête les conseils généraux. »$txt$,
  $txt$[
    {"cle":"liens_publications","libelle":"Liens de vos publications","type":"liste","obligatoire":true,"min_lignes":3,"max_lignes":10},
    {"cle":"vues_total","libelle":"Vues ou portée totale","type":"nombre","obligatoire":true},
    {"cle":"nouveaux_contacts","libelle":"Nouveaux contacts récupérés","type":"nombre","obligatoire":true},
    {"cle":"meilleure_publication","libelle":"Ce qui a le mieux marché, et pourquoi selon vous","type":"texte_long","obligatoire":true},
    {"cle":"ajustement","libelle":"Ce que vous changez pour les 2 semaines suivantes","type":"texte_long","obligatoire":true}
  ]$txt$,
  $txt$[
    "Au moins 3 publications sont réellement en ligne.",
    "Les chiffres sont réels.",
    "L'ajustement découle des chiffres."
  ]$txt$
);
