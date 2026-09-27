-- Migration 0015 : Missions guidées étape 2 — 2.1, 2.2, 2.3
-- ============================================================

-- 1. Passer l'ancienne mission de l'étape 2 à inactive
UPDATE missions SET active = false, ordre = 0
WHERE number = 2
  AND stage_id = (SELECT id FROM stages WHERE number = 2);

-- 2. Créer les missions 2.1, 2.2, 2.3 (UUID auto-généré par gen_random_uuid())
INSERT INTO missions (stage_id, code, number, order_index, title, objective, estimated_duration_minutes, ordre, active, pourquoi, exemple_avant, exemple_apres, champs, criteres)
VALUES (
  (SELECT id FROM stages WHERE number = 2),
  '2.1',
  2,
  1,
  'Formuler votre promesse',
  'Dites en une phrase claire pour qui vous êtes, quel résultat vous apportez, en combien de temps et sans quelle contrainte.',
  30,
  1,
  true,
  'Un prospect décide en quelques secondes si votre offre est pour lui. Si votre promesse est vague, il passe son chemin, même si votre accompagnement est excellent. Une bonne promesse dit pour qui c''est, quel résultat on obtient, en combien de temps, et sans quel obstacle.',
  'J''accompagne les femmes entrepreneures à développer leur business.',
  'J''aide les couturières qui vendent sur WhatsApp à obtenir 10 commandes de plus par mois en 60 jours, sans payer de publicité.',
  '[
    {"cle":"pour_qui","libelle":"Pour qui ?","aide":"Un métier et une situation précise : \"les coachs sportifs qui débutent en ligne\", pas \"tout le monde\".","type":"texte","obligatoire":true},
    {"cle":"probleme","libelle":"Quel problème les empêche de dormir ?","aide":"Avec leurs mots à eux, ceux qu''ils vous disent en conversation.","type":"texte_long","obligatoire":true},
    {"cle":"resultat","libelle":"Quel résultat concret obtiennent-ils ?","aide":"Un chiffre ou un changement visible.","type":"texte","obligatoire":true},
    {"cle":"delai","libelle":"En combien de temps ?","type":"texte","obligatoire":true},
    {"cle":"sans_obstacle","libelle":"Sans quel obstacle ou quelle contrainte ?","aide":"Par exemple : sans y passer ses soirées, sans budget pub.","type":"texte","obligatoire":true},
    {"cle":"promesse","libelle":"Votre promesse en une phrase","aide":"J''aide [pour qui] à [résultat] en [délai] sans [obstacle].","type":"texte_long","obligatoire":true}
  ]',
  '[
    "La cible est nommée par un métier ou une situation, jamais par « tout le monde » ou « les entrepreneurs ».",
    "Le résultat est mesurable ou observable.",
    "Un inconnu comprend la promesse en moins de 10 secondes."
  ]'
);

INSERT INTO missions (stage_id, code, number, order_index, title, objective, estimated_duration_minutes, ordre, active, pourquoi, exemple_avant, exemple_apres, champs, criteres)
VALUES (
  (SELECT id FROM stages WHERE number = 2),
  '2.2',
  3,
  2,
  'Construire votre package',
  'Décrivez semaine après semaine ce que le client reçoit, pour qu''il visualise le parcours avant d''acheter.',
  40,
  2,
  true,
  'Le client n''achète pas « un accompagnement ». Il achète ce qu''il va recevoir, semaine après semaine. Plus il visualise le parcours, plus l''achat lui paraît sûr.',
  'Suivi de 3 mois avec des points réguliers.',
  'Programme Atelier Plein, 8 semaines. Semaine 1 : audit de votre catalogue WhatsApp. Semaines 2 et 3 : 3 modèles de messages de relance prêts à envoyer. Chaque semaine : 1 h de séance de groupe. Semaine 6 : revue de vos prix. Bonus : groupe d''entraide des participantes.',
  '[
    {"cle":"nom_offre","libelle":"Nom de votre offre","type":"texte","obligatoire":true},
    {"cle":"format","libelle":"Format","options":["Accompagnement individuel","Accompagnement de groupe","Formation","Service réalisé pour le client","Produit"],"type":"choix","obligatoire":true},
    {"cle":"duree","libelle":"Durée totale","type":"texte","obligatoire":true},
    {"cle":"elements","libelle":"Ce que le client reçoit concrètement","aide":"Pour chaque élément, précisez à quoi il sert.","type":"liste","obligatoire":true,"min_lines":3,"max_lines":6},
    {"cle":"etapes","libelle":"Les étapes du parcours client, dans l''ordre","type":"liste","obligatoire":true,"min_lines":3,"max_lines":5},
    {"cle":"bonus","libelle":"Bonus","type":"texte_long","obligatoire":false},
    {"cle":"non_inclus","libelle":"Ce qui n''est PAS inclus","aide":"Ça évite les malentendus et les demandes hors cadre.","type":"texte_long","obligatoire":true}
  ]',
  '[
    "Chaque élément reçu sert directement la promesse de la mission 2.1.",
    "Le client peut se représenter ce qui se passe à chaque étape.",
    "Il n''y a pas plus de 6 éléments."
  ]'
);

INSERT INTO missions (stage_id, code, number, order_index, title, objective, estimated_duration_minutes, ordre, active, pourquoi, exemple_avant, exemple_apres, champs, criteres)
VALUES (
  (SELECT id FROM stages WHERE number = 2),
  '2.3',
  4,
  3,
  'Fixer votre prix et votre garantie',
  'Positionnez votre prix par rapport à la valeur du résultat pour le client, et ajoutez une garantie que vous pouvez tenir.',
  30,
  3,
  true,
  'Un prix se juge par rapport à ce que le résultat rapporte au client, pas par rapport à vos heures de travail. Une garantie bien pensée enlève la dernière hésitation, sans vous mettre en danger.',
  'Prix : 150 000 FCFA.',
  '150 000 FCFA, ou 2 fois 80 000 FCFA. Dix commandes de plus par mois à 15 000 FCFA de marge, c''est 150 000 FCFA gagnés dès le premier mois. Garantie : si vous avez réalisé toutes les missions et que vous n''avez aucune commande supplémentaire au bout de 8 semaines, on continue ensemble gratuitement pendant 4 semaines.',
  '[
    {"cle":"prix","libelle":"Prix (FCFA)","type":"nombre","obligatoire":true},
    {"cle":"modalites","libelle":"Modalités de paiement","options":["En une fois","En 2 ou 3 fois","Mensuel"],"type":"choix","obligatoire":true},
    {"cle":"valeur_client","libelle":"Combien le résultat rapporte ou fait économiser au client (FCFA)","type":"nombre","obligatoire":true},
    {"cle":"garantie","libelle":"Votre garantie","aide":"Prolonger l''accompagnement est souvent plus tenable qu''un remboursement.","type":"texte_long","obligatoire":true},
    {"cle":"objections","libelle":"Les 3 objections que vous entendez le plus, et votre réponse à chacune","type":"liste","obligatoire":true,"min_lines":3,"max_lines":3},
    {"cle":"offre_complete","libelle":"Votre offre complète en 3 lignes : promesse, contenu, prix et garantie","type":"texte_long","obligatoire":true}
  ]',
  '[
    "Le résultat vaut au moins 5 fois le prix pour le client, avec un calcul visible.",
    "La garantie est claire et vous pouvez la tenir.",
    "Aucune fausse urgence : s''il y a une limite de places ou de date, elle est réelle."
  ]'
);
