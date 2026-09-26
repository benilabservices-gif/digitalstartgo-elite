-- Migration 0012 : Missions guidées — colonnes, contraintes et seed
-- ============================================================

-- 1. Nouvelles colonnes sur missions
ALTER TABLE missions ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS ordre integer DEFAULT 1;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS pourquoi text;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS exemple_avant text;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS exemple_apres text;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS champs jsonb;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS criteres jsonb;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS guide_outil jsonb;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS prompts_ia jsonb;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS bonus_elite text;

-- 2. Nouvelle colonne sur mission_submissions
ALTER TABLE mission_submissions ADD COLUMN IF NOT EXISTS reponses jsonb;

-- 3. Remplir code et ordre pour les 8 missions existantes
--    code = numéro d'étape, ordre = 1 (une seule mission par étape à l'origine)
UPDATE missions SET code = number::text, ordre = 1 WHERE code IS NULL;

-- 4. Passer l'ancienne mission de l'étape 1 à inactive
UPDATE missions SET active = false, ordre = 0
WHERE number = 1
  AND stage_id = (SELECT id FROM stages WHERE number = 1);

-- 4 bis. La contrainte UNIQUE (number) doit disparaître AVANT d'insérer 1.1 / 1.2
ALTER TABLE missions DROP CONSTRAINT IF EXISTS missions_number_key;

-- 5. Créer les missions 1.1 et 1.2 (UUID auto-généré par gen_random_uuid())
INSERT INTO missions (stage_id, code, number, order_index, title, objective, estimated_duration_minutes, ordre, active, pourquoi, exemple_avant, exemple_apres, champs, criteres)
VALUES (
  (SELECT id FROM stages WHERE number = 1),
  '1.1',
  1,
  1,
  'Faire l''état des lieux de votre activité',
  'Photographiez votre activité telle qu''elle est aujourd''hui : c''est le point de départ de tout le parcours.',
  20,
  1,
  true,
  'On ne construit pas un système de vente sur des impressions. Cette mission photographie votre activité telle qu''elle est aujourd''hui : c''est le point de départ de tout le parcours. Répondez avec vos vrais chiffres. « Je ne sais pas » est une réponse acceptée, et c''est déjà une information utile.',
  'Mon business marche moyennement, je vends de temps en temps.',
  'Coaching nutrition à 50 000 FCFA. 4 ventes ces 3 derniers mois, toutes par bouche-à-oreille. Environ 12 personnes intéressées ce mois-ci sur WhatsApp. Pas de page de vente, pas de relance.',
  '[
    {"cle":"offre_actuelle","libelle":"Votre offre actuelle et son prix","aide":"Ce que vous vendez aujourd''hui et à combien.","type":"texte_long","obligatoire":true,"prerempli_depuis":{"profil":"main_offer"}},
    {"cle":"ventes_3_mois","libelle":"Nombre de ventes ces 3 derniers mois","type":"nombre","obligatoire":true},
    {"cle":"ca_3_mois","libelle":"Chiffre d''affaires ces 3 derniers mois (FCFA)","type":"nombre","obligatoire":true},
    {"cle":"interesses_mois","libelle":"Nombre de personnes intéressées ce mois-ci","aide":"Messages, demandes de prix, commentaires ''intéressé''.","type":"nombre","obligatoire":true},
    {"cle":"offre","libelle":"Pouvez-vous dire en une phrase pour qui est votre offre et quel résultat elle apporte ?","type":"choix","obligatoire":true,"options":["Non","Oui, mais c''est flou","Oui, clairement"],"points":[0,5,10]},
    {"cle":"positionnement","libelle":"Savez-vous précisément qui est votre client idéal (métier, situation) ?","type":"choix","obligatoire":true,"options":["Non","Vaguement","Oui, je peux le décrire"],"points":[0,5,10]},
    {"cle":"audience","libelle":"Taille de votre audience totale (abonnés, contacts WhatsApp, emails)","type":"choix","obligatoire":true,"options":["Moins de 100","100 à 1 000","1 000 à 5 000","Plus de 5 000"],"points":[0,3,6,10]},
    {"cle":"acquisition","libelle":"D''où viennent vos clients ?","type":"choix","obligatoire":true,"options":["Je ne sais pas","Uniquement le bouche-à-oreille","Un canal régulier (réseaux, pub, partenaires)","Plusieurs canaux réguliers"],"points":[0,3,7,10]},
    {"cle":"captureDeLeads","libelle":"Avez-vous un moyen de récupérer les contacts de vos prospects (ressource gratuite, formulaire, liste) ?","type":"choix","obligatoire":true,"options":["Non","Oui, mais peu utilisé","Oui, et il fonctionne"],"points":[0,5,10]},
    {"cle":"funnel","libelle":"Existe-t-il un parcours clair jusqu''au paiement (page de vente, lien de paiement) ?","type":"choix","obligatoire":true,"options":["Non, tout se fait en conversation","En partie","Oui, en ligne"],"points":[0,5,10]},
    {"cle":"conversion","libelle":"Sur 10 personnes intéressées, combien achètent ?","type":"choix","obligatoire":true,"options":["Je ne sais pas ou aucune","1 à 2","3 à 4","5 ou plus"],"points":[0,4,7,10]},
    {"cle":"relance","libelle":"Relancez-vous les personnes qui n''ont pas acheté ?","type":"choix","obligatoire":true,"options":["Jamais","Parfois, à la main","Oui, avec une séquence prête"],"points":[0,5,10]},
    {"cle":"analytics","libelle":"Connaissez-vous vos chiffres du mois dernier (prospects, ventes, chiffre d''affaires) ?","type":"choix","obligatoire":true,"options":["Non","En partie","Oui, je les note"],"points":[0,5,10]}
  ]',
  '[
    "Les chiffres (ventes, chiffre d''affaires, personnes intéressées) sont renseignés honnêtement.",
    "Les réponses sont cohérentes entre elles.",
    "L''offre actuelle est décrite avec son prix."
  ]'
);

INSERT INTO missions (stage_id, code, number, order_index, title, objective, estimated_duration_minutes, ordre, active, pourquoi, exemple_avant, exemple_apres, champs, criteres)
VALUES (
  (SELECT id FROM stages WHERE number = 1),
  '1.2',
  2,
  2,
  'Fixer votre objectif à 90 jours',
  'Sans ligne d''arrivée, impossible de savoir si le parcours vous fait progresser.',
  15,
  2,
  true,
  'Sans ligne d''arrivée, impossible de savoir si le parcours vous fait progresser. Un bon objectif est chiffré, assez ambitieux pour vous motiver, mais réaliste par rapport à votre point de départ et au temps dont vous disposez.',
  'Je veux vivre de mon business.',
  '600 000 FCFA de chiffre d''affaires en 90 jours, soit 12 ventes à 50 000 FCFA, 1 par semaine. J''ai 5 h par semaine. Ce qui m''a bloqué : je ne relance jamais les personnes intéressées.',
  '[
    {"cle":"ca_vise","libelle":"Chiffre d''affaires visé dans 90 jours (FCFA)","type":"nombre","obligatoire":true},
    {"cle":"prix_moyen","libelle":"Prix moyen d''une vente (FCFA)","type":"nombre","obligatoire":true,"prerempli_depuis":{"profil":"price"}},
    {"cle":"temps_semaine","libelle":"Temps disponible par semaine pour votre activité","type":"choix","obligatoire":true,"options":["Moins de 3 h","3 à 5 h","5 à 10 h","Plus de 10 h"]},
    {"cle":"blocage","libelle":"Ce qui vous a le plus bloqué jusqu''ici","aide":"Soyez concret : ''je ne relance jamais'', pas ''le manque de motivation''.","type":"texte_long","obligatoire":true},
    {"cle":"motivation","libelle":"Pourquoi cet objectif compte pour vous","type":"texte_long","obligatoire":true}
  ]',
  '[
    "L''objectif est chiffré en FCFA et en nombre de ventes.",
    "Il est réaliste par rapport au point de départ et au temps disponible.",
    "Le blocage cité est concret."
  ]'
);

-- 6. Supprimer l'ancienne contrainte unique sur number et ajouter les nouvelles
ALTER TABLE missions ADD CONSTRAINT missions_code_key UNIQUE (code);
ALTER TABLE missions ADD CONSTRAINT missions_stage_ordre_key UNIQUE (stage_id, ordre);

