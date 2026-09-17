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
