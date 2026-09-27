-- Migration 0020 : Missions guidées étape 6 « Mon Funnel » — 6.1, 6.2, 6.3, 6.4
-- Les textes utilisent la syntaxe $txt$ ... $txt$ : aucune apostrophe ni
-- guillemet à échapper, le JSON reste lisible tel quel.
-- ============================================================

-- 1. Passer l'ancienne mission de l'étape 6 à inactive
UPDATE missions SET active = false, ordre = 0
WHERE number = 6
  AND stage_id = (SELECT id FROM stages WHERE number = 6);

-- 2. Mission 6.1 — Dessiner votre funnel
INSERT INTO missions (stage_id, code, number, order_index, title, objective, estimated_duration_minutes, ordre, active, pourquoi, exemple_avant, exemple_apres, champs, criteres)
VALUES (
  (SELECT id FROM stages WHERE number = 6),
  '6.1', 6, 1,
  $txt$Dessiner votre funnel$txt$,
  $txt$Un funnel, c'est le chemin que suit un inconnu jusqu'à devenir client. En l'écrivant étape par étape, vous voyez où ils décrochent et ce qui manque.$txt$,
  20, 1, true,
  $txt$Un funnel, c'est le chemin que suit un inconnu jusqu'à devenir client. Quand ce chemin est flou, les prospects se perdent en route. En l'écrivant étape par étape, vous voyez où ils décrochent et ce qui manque.$txt$,
  $txt$« Les gens voient mes posts, puis m'écrivent… parfois. »$txt$,
  $txt$« 1. Vidéo TikTok → 2. Lien en bio vers la checklist (capture du numéro) → 3. 3 messages WhatsApp en 5 jours → 4. Page de vente → 5. Paiement Mobile Money → 6. Message d'accueil. »$txt$,
  $txt$[
    {"cle":"etapes_funnel","libelle":"Les étapes de votre funnel, de la première rencontre au paiement","type":"liste","obligatoire":true,"min_lignes":3,"max_lignes":7,"aide":"Pour chaque étape : ce qui se passe, et l'outil utilisé."},
    {"cle":"contact_humain","libelle":"À quel moment le prospect peut-il vous parler directement ?","type":"texte_long","obligatoire":true},
    {"cle":"point_faible","libelle":"L'étape où vous perdez le plus de monde aujourd'hui, selon vous","type":"texte_long","obligatoire":true}
  ]$txt$,
  $txt$[
    "Chaque étape a un seul objectif.",
    "Pas plus de 5 étapes entre la première rencontre et le paiement.",
    "Le paiement est possible depuis un téléphone (Mobile Money ou carte)."
  ]$txt$
);

-- 3. Mission 6.2 — Rédiger votre page de vente
INSERT INTO missions (stage_id, code, number, order_index, title, objective, estimated_duration_minutes, ordre, active, pourquoi, exemple_avant, exemple_apres, champs, criteres, prompts_ia)
VALUES (
  (SELECT id FROM stages WHERE number = 6),
  '6.2', 6, 2,
  $txt$Rédiger votre page de vente$txt$,
  $txt$Votre page de vente travaille pour vous jour et nuit. Elle reprend tout ce que vous avez construit dans un ordre qui rassure et donne envie d'acheter.$txt$,
  90, 2, true,
  $txt$Votre page de vente travaille pour vous jour et nuit. Elle reprend tout ce que vous avez construit (promesse, package, prix, preuves) dans un ordre qui rassure et donne envie d'acheter. Vous la rédigez d'abord ici, avant de la mettre en ligne.$txt$,
  $txt$Une page qui commence par « Bienvenue, je m'appelle… » et donne le prix sans expliquer ce qu'on reçoit.$txt$,
  $txt$Titre = la promesse. Puis le problème avec les mots du client, l'offre semaine par semaine, 2 témoignages, le prix avec son calcul de valeur, la garantie, 4 questions fréquentes, et un seul bouton « Je réserve ma place », répété 3 fois.$txt$,
  $txt$[
    {"cle":"titre","libelle":"Titre (votre promesse)","type":"texte","obligatoire":true,"prerempli_depuis":{"mission":"2.1","cle":"promesse"}},
    {"cle":"sous_titre","libelle":"Sous-titre","type":"texte","obligatoire":true,"aide":"Pour qui, et en combien de temps."},
    {"cle":"probleme","libelle":"Le problème, avec les mots de votre client","type":"texte_long","obligatoire":true,"prerempli_depuis":{"mission":"3.1","cle":"frustrations"}},
    {"cle":"offre","libelle":"Ce que le client reçoit","type":"texte_long","obligatoire":true,"prerempli_depuis":{"mission":"2.2","cle":"elements"}},
    {"cle":"preuves","libelle":"Vos preuves : témoignages, résultats, captures","type":"liste","obligatoire":true,"min_lignes":1,"max_lignes":5,"aide":"De vraies preuves seulement. Si vous n'en avez pas encore, racontez votre propre parcours."},
    {"cle":"prix_garantie","libelle":"Prix, modalités et garantie","type":"texte_long","obligatoire":true,"prerempli_depuis":{"mission":"2.3","cle":"offre_complete"}},
    {"cle":"faq","libelle":"Questions fréquentes, avec leurs réponses","type":"liste","obligatoire":true,"min_lignes":3,"max_lignes":6,"prerempli_depuis":{"mission":"2.3","cle":"objections"}},
    {"cle":"bouton","libelle":"Texte de votre bouton d'action","type":"texte","obligatoire":true,"aide":"Un verbe d'action : « Je réserve ma place », « Je commence ». "}
  ]$txt$,
  $txt$[
    "Le titre reprend la promesse de la mission 2.1.",
    "Il y a au moins une preuve réelle.",
    "Un seul bouton d'action, avec le même texte partout sur la page."
  ]$txt$,
  $txt$[
    {"titre":"Rédiger ma page de vente complète","prompt":"Tu es un copywriter expert en pages de vente pour des entrepreneurs d'Afrique francophone. Rédige une page de vente en français, claire et chaleureuse, lisible sur téléphone, avec ces sections dans l'ordre : titre, sous-titre, problème, solution, ce que le client reçoit, preuves, prix et garantie, questions fréquentes, appel à l'action répété 3 fois. N'invente aucun témoignage ni aucun chiffre : utilise uniquement les informations suivantes.
Promesse : {{2.1.promesse}}
Client idéal : {{3.1.qui}}
Ses frustrations : {{3.1.frustrations}}
Ce qu'il veut : {{3.1.desir}}
Offre : {{2.2.nom_offre}}, {{2.2.duree}}
Ce qu'il reçoit : {{2.2.elements}}
Étapes : {{2.2.etapes}}
Prix et garantie : {{2.3.offre_complete}}
Objections : {{2.3.objections}}
Positionnement : {{3.2.phrase_positionnement}}
Preuve : {{3.2.preuve}}"},
    {"titre":"Proposer 5 titres plus percutants","prompt":"Voici la promesse de mon offre : {{2.1.promesse}}. Mon client idéal : {{3.1.qui}}. Propose 5 titres de page de vente de moins de 15 mots, chacun avec un angle différent (résultat, délai, obstacle évité, curiosité, témoignage). En français simple."},
    {"titre":"Transformer mes objections en FAQ","prompt":"Voici les objections de mes prospects et mes réponses : {{2.3.objections}}. Rédige une FAQ de 5 questions-réponses courtes et rassurantes pour ma page de vente, en français simple, sans promesse que je ne peux pas tenir."}
  ]$txt$
);

-- 4. Mission 6.3 — Mettre votre page de vente en ligne
INSERT INTO missions (stage_id, code, number, order_index, title, objective, estimated_duration_minutes, ordre, active, pourquoi, exemple_avant, exemple_apres, champs, criteres, guide_outil, bonus_elite)
VALUES (
  (SELECT id FROM stages WHERE number = 6),
  '6.3', 6, 3,
  $txt$Mettre votre page de vente en ligne$txt$,
  $txt$Une page qui n'est pas en ligne ne vend rien. Et une page en ligne où le paiement échoue est pire que pas de page du tout.$txt$,
  60, 3, true,
  $txt$Une page qui n'est pas en ligne ne vend rien. Et une page en ligne où le paiement échoue est pire que pas de page du tout. Cette mission consiste à publier votre page et à tester un achat de bout en bout, depuis un téléphone.$txt$,
  $txt$« La page est presque prête, il manque juste le paiement. »$txt$,
  $txt$Page en ligne sur Systeme.io. Paiement Mobile Money testé avec 100 FCFA depuis mon téléphone : reçu, email de confirmation, accès envoyé.$txt$,
  $txt$[
    {"cle":"lien_page","libelle":"Lien de votre page de vente","type":"lien","obligatoire":true},
    {"cle":"outil_page","libelle":"Outil utilisé","type":"choix","obligatoire":true,"options":["Systeme.io","Chariow","WordPress","Carrd","Autre"],"preselection":0},
    {"cle":"paiement","libelle":"Moyen de paiement","type":"choix","obligatoire":true,"options":["Lien de paiement Mobile Money ou carte","Paiement dans l'outil de la page","Paiement à la livraison","Virement ou dépôt manuel"]},
    {"cle":"test_achat","libelle":"Avez-vous testé un achat complet depuis un téléphone ?","type":"choix","obligatoire":true,"options":["Oui, tout fonctionne","Oui, mais il reste un problème","Non"]},
    {"cle":"probleme_restant","libelle":"S'il reste un problème, lequel ?","type":"texte_long","obligatoire":false}
  ]$txt$,
  $txt$[
    "La page s'ouvre et se lit correctement sur téléphone (le coach vérifie).",
    "Un achat a été testé de bout en bout.",
    "Le bouton mène bien au paiement."
  ]$txt$,
  $txt$[
    {"titre":"Créer votre compte Systeme.io","texte":"Le plan gratuit suffit pour démarrer : il permet un tunnel complet et des paiements.","lien_video":""},
    {"titre":"Créer un tunnel de vente","texte":"Tunnels → Créer → objectif « Vendre un produit ». Nommez-le comme votre offre.","lien_video":""},
    {"titre":"Construire la page de vente","texte":"Choisissez un modèle simple, puis collez les textes de votre mission 6.2, section par section. Vérifiez l'aperçu mobile.","lien_video":""},
    {"titre":"Brancher le paiement","texte":"Paramètres de paiement → connectez votre moyen de paiement, puis créez l'offre avec votre prix de la mission 2.3.","lien_video":""},
    {"titre":"Ajouter la page de remerciement","texte":"Dernière étape du tunnel : le message d'accueil de la mission 6.4.","lien_video":""},
    {"titre":"Tester un achat depuis votre téléphone","texte":"Faites un vrai achat avec un petit montant, et vérifiez chaque email reçu.","lien_video":""}
  ]$txt$,
  $txt$$VIP## Votre tunnel de vente premium. Importez-le dans votre compte Systeme.io avec le lien de partage fourni par votre coach, puis remplacez les textes par ceux de votre mission 6.2. Votre coach vous accompagne lors de votre prochaine séance individuelle. $$
);

-- 5. Mission 6.4 — Accueillir votre nouveau client
INSERT INTO missions (stage_id, code, number, order_index, title, objective, estimated_duration_minutes, ordre, active, pourquoi, exemple_avant, exemple_apres, champs, criteres)
VALUES (
  (SELECT id FROM stages WHERE number = 6),
  '6.4', 6, 4,
  $txt$Accueillir votre nouveau client$txt$,
  $txt$Les minutes qui suivent le paiement décident si votre client se sent rassuré ou s'il regrette son achat.$txt$,
  30, 4, true,
  $txt$Les minutes qui suivent le paiement décident si votre client se sent rassuré ou s'il regrette son achat. Un accueil rapide et clair réduit les demandes de remboursement et donne envie de recommander.$txt$,
  $txt$« Je vois le paiement le lendemain et j'envoie un message. »$txt$,
  $txt$Dès le paiement : page de remerciement avec la marche à suivre + message WhatsApp automatique avec le lien du groupe et la date de la première séance. Je reçois une notification à chaque vente.$txt$,
  $txt$[
    {"cle":"message_accueil","libelle":"Le message que reçoit le client juste après le paiement","type":"texte_long","obligatoire":true},
    {"cle":"premieres_etapes","libelle":"Ce qu'il reçoit ou doit faire dans les 24 premières heures","type":"liste","obligatoire":true,"min_lignes":2,"max_lignes":5},
    {"cle":"notification","libelle":"Comment êtes-vous prévenu d'une nouvelle vente ?","type":"texte","obligatoire":true}
  ]$txt$,
  $txt$[
    "Le client sait exactement quoi faire ensuite.",
    "L'accueil est automatique, ou se fait en moins d'une heure.",
    "Vous êtes prévenu de chaque vente."
  ]$txt$
);