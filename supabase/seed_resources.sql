-- Guide étape 4 : Lead Magnet
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

-- Guide étape 5 : Acquisition
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

-- Guide étape 6 : Funnel (Page de vente)
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

-- Guide étape 7 : Conversion & Relance
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

-- Guide étape 8 : Mesure & Optimisation
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
