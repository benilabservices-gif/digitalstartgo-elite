-- Guide étape 4 : Lead Magnet
insert into resources (stage_id, slug, title, description, type, content_blocks, order_index)
select id, 'guide-lead-magnet', 'Créer un lead magnet qui convertit',
  'Comment produire une ressource gratuite qui attire vos prospects idéaux et commence la relation.',
  'guide',
  '[
    {"type": "paragraph", "text": "Un lead magnet n&apos;est pas un ebook de 50 pages que personne ne lit. C&apos;est une promesse précise tenue en 15 minutes. Votre prospect doit ressortir avec un résultat concret, immédiatement applicable."},
    {"type": "heading", "text": "La règle des 3 questions"},
    {"type": "list", "items": [
      "Quelle douleur spécifique résout ce lead magnet ?",
      "En combien de temps le prospect peut-il obtenir le résultat ?",
      "Que doit-il faire ensuite chez vous pour continuer à avancer ?"
    ]},
    {"type": "heading", "text": "Formats qui fonctionnent en 2024"},
    {"type": "list", "items": [
      "Template / checklist utilisable immédiatement",
      "Quiz diagnostique avec recommandation personnalisée",
      "Mini-forme vidéo de 10 minutes avec exercice pratique",
      "Étude de cas détaillée avec les étapes reproduites"
    ]},
    {"type": "heading", "text": "Erreur à éviter"},
    {"type": "paragraph", "text": "Demander trop d&apos;informations avant de donner la valeur. Minimum : email uniquement. Nom si nécessaire. Tout le reste vient après la conversion."}
  ]'::jsonb,
  1
from stages where number = 4;

-- Guide étape 5 : Acquisition
insert into resources (stage_id, slug, title, description, type, content_blocks, order_index)
select id, 'guide-acquisition', 'Lancer votre premier canal d&apos;acquisition',
  'Mettre en place une source de trafic régulière vers votre funnel.',
  'guide',
  '[
    {"type": "paragraph", "text": "Ne cherchez pas trois canaux. Choisissez-en UN seul, maîtrisez-le pendant 30 jours, puis seulement envisagez d&apos;en ajouter un deuxième. La diversité prématurée dilue vos résultats et rend impossible la mesure."},
    {"type": "heading", "text": "Les 3 canaux les plus accessibles"},
    {"type": "list", "items": [
      "LinkedIn organique — idéal si votre cible est professionnelle B2B",
      "YouTube court (Shorts) — atteinte virale potentielle, construction de marque à long terme",
      "Partenariats d&apos;auteurs — emprunter l&apos;audience de quelqu&apos;un qui a déjà votre audience"
    ]},
    {"type": "heading", "text": "Le métrique qui compte vraiment"},
    {"type": "paragraph", "text": "Pas les vues, pas les likes. Le coût par lead capturé. Si vous dépensez 5 000 FCFA pour un lead, et que votre offre se vend à 50 000 FCFA, vous avez un modèle viable. Tout le reste est du bruit."},
    {"type": "heading", "text": "Cadence minimale recommandée"},
    {"type": "paragraph", "text": "3 publications par semaine sur le canal choisi, pendant 30 jours consécutifs. Rien d&apos;autre ne donne assez de données pour prendre une décision éclairée."}
  ]'::jsonb,
  1
from stages where number = 5;

-- Guide étape 6 : Funnel
insert into resources (stage_id, slug, title, description, type, content_blocks, order_index)
select id, 'guide-funnel', 'Construire votre funnel complet',
  'De la landing page de capture au checkout : chaque page a un rôle précis.',
  'guide',
  '[
    {"type": "paragraph", "text": "Un funnel n&apos;est pas une page web. C&apos;est un chemin chronologique où chaque étape élimine les prospects qui ne sont pas prêts, tout en accélérant ceux qui le sont."},
    {"type": "heading", "text": "Les 4 pages obligatoires"},
    {"type": "list", "items": [
      "Landing page de capture — promet un résultat, collecte l&apos;email, présente le lead magnet",
      "Page de vente — développe la promesse, traite les objections, présente l&apos;offre et le prix",
      "Checkout — résume l&apos;offre, finalise le paiement, minimise la friction",
      "Page de remerciement — confirme l&apos;achat, propose l&apos;étape suivante, crée l&apos;immersion post-paiement"
    ]},
    {"type": "heading", "text": "La règle du CTA unique"},
    {"type": "paragraph", "text": "Chaque page doit avoir un seul objectif clair. Si une page essaie de faire deux choses, elle en fait aucune. Landing page = capture. Page de vente = achat. Page de remerciement = next step."},
    {"type": "heading", "text": "Outils recommandés"},
    {"type": "paragraph", "text": "Pour démarrer : Carrd (landing simple), Systeme.io (funnel complet avec email), ou WordPress + Elementor si vous voulez contrôle total. Ne choisissez pas en fonction de vos envies — choisissez en fonction du temps que vous pouvez y consacrer cette semaine."}
  ]'::jsonb,
  1
from stages where number = 6;

-- Guide étape 7 : Conversion & Relance
insert into resources (stage_id, slug, title, description, type, content_blocks, order_index)
select id, 'guide-conversion-relance', 'Optimiser conversion et relance',
  'Transformer les prospects tièdes en clients, et les clients en repetiteurs.',
  'guide',
  '[
    {"type": "paragraph", "text": "La majorité de vos ventes ne viennent pas du premier contact. Elles viennent du 3ème à 7ème échange. Votre séquence de relance est votre réseau de vente le plus sous-estimé."},
    {"type": "heading", "text": "La séquence de relance en 5 emails"},
    {"type": "list", "items": [
      "Jour 0 — Remerciement + accès au lead magnet (delivery)",
      "Jour 1 — Histoire personnelle : pourquoi vous faites ce que vous faites",
      "Jour 3 — Preuve sociale : un client qui a obtenu un résultat concret",
      "Jour 5 — Offre : présentation de votre produit/service avec garantie",
      "Jour 7 — Dernière chance : rappel de l&apos;offre, pression douce, dernière opportunité"
    ]},
    {"type": "heading", "text": "Les 3 objections à anticiper"},
    {"type": "list", "items": [
      "« C&apos;est trop cher » — répondre par le coût de NE PAS agir",
      "« Je vais réfléchir » — répondre par une question qui révèle la vraie objection",
      "« Ce n&apos;est pas pour moi » — répondre en montrant un cas identique au leur"
    ]},
    {"type": "heading", "text": "Le suivi WhatsApp comme avantage concurrentiel"},
    {"type": "paragraph", "text": "En Afrique francophone, WhatsApp est plus lu que les emails. Un message personnel de suivi 48h après l&apos;inscription au lead magnet augmente le taux de conversion de 30 à 50%. Pas besoin d&apos;automation complexe : un message sincère, handwritten."}
  ]'::jsonb,
  1
from stages where number = 7;

-- Guide étape 8 : Mesure & Optimisation
insert into resources (stage_id, slug, title, description, type, content_blocks, order_index)
select id, 'guide-mesure-optimisation', 'Suivre et optimiser vos métriques',
  'Piloter votre système de vente avec des chiffres, pas avec des intuitions.',
  'guide',
  '[
    {"type": "paragraph", "text": "Ce qui ne se mesure pas ne s&apos;optimise pas. Mais attention : mesurer toutes les métriques vous paralyse. Il faut en choisir 3 et les surveiller chaque semaine."},
    {"type": "heading", "text": "Les 3 métriques fondamentales"},
    {"type": "list", "items": [
      "Trafic — nombre de visiteurs uniques sur votre landing page par semaine",
      "Taux de conversion — pourcentage de visiteurs qui laissents leur email",
      "Valeur vie client (LTV) — revenu moyen généré par un client sur 12 mois"
    ]},
    {"type": "heading", "text": "Le tableau de bord hebdomadaire"},
    {"type": "paragraph", "text": "Chaque lundi matin, notez ces 3 chiffres. Pas besoin d&apos;outil sophistiqué : un tableur suffit. L&apos;important n&apos;est pas la précision — c&apos;est la régularité. 8 semaines de données vous donnent une tendance claire."},
    {"type": "heading", "text": "Quand changer d&apos;approche"},
    {"type": "list", "items": [
      "Trafic bas + conversion bonne → le problème est en amont, changez de canal ou de message d&apos;accroche",
      "Trafic bon + conversion basse → le problème est la landing page, testez un nouveau headline",
      "Conversion bonne + peu de ventes → le problème est l&apos;offre ou le prix, affinez votre proposition de valeur"
    ]},
    {"type": "heading", "text": "Rappel important"},
    {"type": "paragraph", "text": "Un chiffre seul ne veut rien dire. C&apos;est la comparaison semaine après semaine qui compte. Une baisse de 10 % cette semaine n&apos;est pas un échec — c&apos;est une donnée. Posez la question : « Pourquoi ? » avant de changer quoi que ce soit."}
  ]'::jsonb,
  1
from stages where number = 8;
