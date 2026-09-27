-- Migration 0016 : Missions guidées étape 3 — 3.1, 3.2
-- ============================================================

-- 1. Passer l'ancienne mission de l'étape 3 à inactive
UPDATE missions SET active = false, ordre = 0
WHERE number = 3
  AND stage_id = (SELECT id FROM stages WHERE number = 3);

-- 2. Créer les missions 3.1 et 3.2 (UUID auto-généré par gen_random_uuid())
INSERT INTO missions (stage_id, code, number, order_index, title, objective, estimated_duration_minutes, ordre, active, pourquoi, exemple_avant, exemple_apres, champs, criteres)
VALUES (
  (SELECT id FROM stages WHERE number = 3),
  '3.1',
  3,
  1,
  'Dresser le portrait de votre client idéal',
  'Décrivez une seule personne réelle, avec ses mots et ses habitudes, pour que vos publications et votre page de vente deviennent évidents à écrire.',
  30,
  1,
  true,
  'Quand vous parlez à tout le monde, personne ne se sent concerné. En décrivant une seule personne réelle, avec ses mots et ses habitudes, vos publications, votre page de vente et vos messages deviennent évidents à écrire, et vos prospects se reconnaissent immédiatement.',
  'Les femmes qui veulent entreprendre.',
  'Aïcha, 32 ans, couturière à Cotonou. Elle vend sur WhatsApp depuis 2 ans, 3 à 5 commandes par mois. Elle a déjà "boosté" des publications Facebook sans résultat. Ce qu''elle dit : "Les gens demandent le prix puis disparaissent." Elle passe ses soirées sur TikTok et dans 3 groupes Facebook de couture.',
  '[
    {"cle":"qui","libelle":"Qui est-ce ?","aide":"Métier, situation, ville, âge approximatif. Pensez à une vraie personne.","type":"texte_long","obligatoire":true,"prerempli_depuis":{"mission":"2.1","cle":"pour_qui"}},
    {"cle":"deja_essaye","libelle":"Qu''a-t-elle déjà essayé pour résoudre son problème, et pourquoi ça n''a pas marché ?","type":"texte_long","obligatoire":true},
    {"cle":"frustrations","libelle":"Ses 3 frustrations, avec ses propres mots","aide":"Des phrases qu''elle dit vraiment, entre guillemets.","type":"liste","obligatoire":true,"min_lines":3,"max_lines":3},
    {"cle":"desir","libelle":"Ce qu''elle veut vraiment obtenir","aide":"Au-delà du résultat : ce que ça change dans sa vie.","type":"texte_long","obligatoire":true},
    {"cle":"ou_la_trouver","libelle":"Où elle passe son temps","aide":"Noms précis : réseaux, groupes, comptes qu''elle suit, lieux, événements.","type":"liste","obligatoire":true,"min_lines":2,"max_lines":5},
    {"cle":"hesitations","libelle":"Ce qui la fait hésiter à acheter","type":"texte_long","obligatoire":true},
    {"cle":"trois_personnes","libelle":"3 personnes réelles qui correspondent à ce portrait","aide":"Prénoms ou initiales suffisent. Si vous n''en trouvez pas 3, le portrait est trop flou ou trop rare.","type":"liste","obligatoire":true,"min_lines":3,"max_lines":3}
  ]',
  '[
    "Le portrait est assez précis pour correspondre à 3 personnes réelles citées.",
    "Les frustrations sont formulées avec les mots du client, pas avec du jargon.",
    "Les lieux où la trouver sont concrets (noms de groupes, de comptes, de réseaux)."
  ]'
);

INSERT INTO missions (stage_id, code, number, order_index, title, objective, estimated_duration_minutes, ordre, active, pourquoi, exemple_avant, exemple_apres, champs, criteres)
VALUES (
  (SELECT id FROM stages WHERE number = 3),
  '3.2',
  3,
  2,
  'Définir votre positionnement',
  'Expliquez en une phrase pourquoi votre client devrait vous choisir vous plutôt qu''une autre solution, avec une preuve qui le rend crédible.',
  30,
  2,
  true,
  'Votre client a d''autres options : un concurrent, une formation gratuite sur YouTube, ou ne rien faire. Votre positionnement explique en une phrase pourquoi vous plutôt qu''une autre solution, avec une preuve qui le rend crédible.',
  'Je suis passionnée et je donne le meilleur de moi-même.',
  'Contrairement aux formations en ligne génériques, je travaille directement sur le catalogue WhatsApp de chaque couturière, parce que j''ai moi-même tenu un atelier pendant 6 ans et que mes 8 premières clientes ont doublé leurs commandes.',
  '[
    {"cle":"alternatives","libelle":"Les 3 principales alternatives à votre offre","aide":"Un concurrent, une solution gratuite, \"ne rien faire\"... et ce que chacune propose.","type":"liste","obligatoire":true,"min_lines":2,"max_lines":3},
    {"cle":"difference","libelle":"Ce que vous faites différemment, et qui compte pour votre client","type":"texte_long","obligatoire":true},
    {"cle":"preuve","libelle":"Votre preuve","aide":"Un résultat client, votre expérience, un chiffre vérifiable.","type":"texte_long","obligatoire":true},
    {"cle":"phrase_positionnement","libelle":"Votre positionnement en une phrase","aide":"Contrairement à [alternative], je [différence] parce que [preuve].","type":"texte_long","obligatoire":true},
    {"cle":"bio","libelle":"Votre bio pour vos réseaux (150 caractères maximum)","aide":"Reprenez votre promesse de la mission 2.1.","type":"texte","obligatoire":true}
  ]',
  '[
    "La différence compte pour le client (pas « je suis passionné » ou « je suis sérieux »).",
    "La preuve est vérifiable.",
    "La bio reprend la promesse et tient en 150 caractères."
  ]'
);
