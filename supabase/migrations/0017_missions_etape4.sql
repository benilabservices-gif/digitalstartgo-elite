-- Migration 0017 : Missions guidées étape 4 — 4.1, 4.2, 4.3
-- ============================================================

-- 1. Passer l'ancienne mission de l'étape 4 à inactive
UPDATE missions SET active = false, ordre = 0
WHERE number = 4
  AND stage_id = (SELECT id FROM stages WHERE number = 4);

-- 2. Créer les missions 4.1, 4.2 et 4.3 (UUID auto-généré par gen_random_uuid())
INSERT INTO missions (stage_id, code, number, order_index, title, objective, estimated_duration_minutes, ordre, active, pourquoi, exemple_avant, exemple_apres, champs, criteres)
VALUES (
  (SELECT id FROM stages WHERE number = 4),
  '4.1',
  4,
  1,
  'Choisir votre lead magnet',
  'Un lead magnet est une ressource gratuite que votre client idéal échange contre son contact. Le bon lead magnet règle un petit problème précis en moins de 10 minutes, et donne naturellement envie de votre offre payante.',
  20,
  1,
  true,
  'Un lead magnet est une ressource gratuite que votre client idéal échange contre son contact. Le bon lead magnet règle un petit problème précis en moins de 10 minutes, et donne naturellement envie de votre offre payante. Un gros ebook que personne ne lit ne sert à rien.',
  ''''Mon ebook de 40 pages sur le business.'''',
  ''''Checklist : les 7 messages WhatsApp qui transforment une demande de prix en commande. Elle se lit en 5 minutes, et la couturière peut l''utiliser le soir même.''''',
  ''[{"cle":"format","libelle":"Format","type":"choix","obligatoire":true,"options":["Checklist","Mini-guide PDF","Modèle à remplir","Mini-formation vidéo","Audio WhatsApp","Quiz ou auto-diagnostic"]},{"cle":"titre","libelle":"Titre","type":"texte","obligatoire":true,"aide":"Le titre promet un résultat précis : \"Les 7 messages qui...\" plutôt que \"Guide du business\"."},{"cle":"probleme_resolu","libelle":"Le petit problème précis qu''il résout","type":"texte_long","obligatoire":true,"prerempli_depuis":{"mission":"3.1","cle":"frustrations"}},{"cle":"temps_consommation","libelle":"Temps pour le lire ou l''utiliser","type":"choix","obligatoire":true,"options":["Moins de 5 minutes","5 à 10 minutes","10 à 20 minutes","Plus de 20 minutes"]},{"cle":"lien_offre","libelle":"Comment il mène à votre offre payante","type":"texte_long","obligatoire":true,"aide":"Il résout un premier petit problème, votre offre résout le grand."}]''',
  ''["Il résout un problème précis, en 10 minutes maximum.","Le titre promet un résultat concret.","Il mène logiquement vers l''offre de l''étape 2."]''
);

INSERT INTO missions (stage_id, code, number, order_index, title, objective, estimated_duration_minutes, ordre, active, pourquoi, exemple_avant, exemple_apres, champs, criteres)
VALUES (
  (SELECT id FROM stages WHERE number = 4),
  '4.2',
  4,
  2,
  'Créer votre lead magnet',
  'C''est souvent le premier contact réel entre vous et votre futur client. Il doit être court, utile tout de suite, et se terminer par une invitation claire vers l''étape suivante.',
  90,
  2,
  true,
  'C''est souvent le premier contact réel entre vous et votre futur client. Il doit être court, utile tout de suite, et se terminer par une invitation claire vers l''étape suivante.',
  ''''Un document sans structure, qui se termine sans rien proposer.''''',
  ''''7 messages prêts à copier, chacun avec « quand l''envoyer ». Dernière page : « Vous voulez qu''on applique ces messages à votre catalogue ? Écrivez-moi « ATELIER » sur WhatsApp. »''''',
  ''[{"cle":"lien_ressource","libelle":"Lien vers votre lead magnet","type":"lien","obligatoire":true,"aide":"Google Drive, Canva, YouTube non répertorié... Vérifiez qu''il s''ouvre sans demander d''autorisation."},{"cle":"plan","libelle":"Son contenu, point par point","type":"liste","obligatoire":true,"min_lignes":3,"max_lignes":7},{"cle":"appel_action","libelle":"L''appel à l''action final","type":"texte","obligatoire":true,"aide":"Ce que la personne doit faire après : vous écrire, réserver un appel, voir votre offre."}]''',
  ''["Le lien s''ouvre sans autorisation.","Chaque point est applicable immédiatement.","Il se termine par une invitation claire vers la suite."]''
);

INSERT INTO missions (stage_id, code, number, order_index, title, objective, estimated_duration_minutes, ordre, active, pourquoi, exemple_avant, exemple_apres, champs, criteres, guide_outil, prompts_ia)
VALUES (
  (SELECT id FROM stages WHERE number = 4),
  '4.3',
  4,
  3,
  'Mettre en place la capture des contacts',
  'Un lead magnet n''est utile que si vous récupérez le contact de ceux qui le demandent. Sans liste de contacts, chaque publication repart de zéro. Avec elle, vous pouvez relancer, informer et vendre.',
  30,
  3,
  true,
  'Un lead magnet n''est utile que si vous récupérez le contact de ceux qui le demandent. Sans liste de contacts, chaque publication repart de zéro. Avec elle, vous pouvez relancer, informer et vendre.',
  ''''J''envoie le PDF en message privé à ceux qui commentent.''''',
  ''''Un lien dans ma bio mène à un formulaire (prénom et numéro WhatsApp). Le PDF est envoyé automatiquement, et le contact est ajouté à ma liste. 14 contacts la première semaine.''''',
  ''[{"cle":"outil","libelle":"Outil de capture","type":"choix","obligatoire":true,"options":["Page de capture Systeme.io","Formulaire Google","Lien WhatsApp avec message pré-rempli","Autre"]},{"cle":"lien_capture","libelle":"Lien de votre page ou formulaire de capture","type":"lien","obligatoire":true},{"cle":"infos_demandees","libelle":"Ce que vous demandez au prospect","type":"liste","obligatoire":true,"min_lignes":1,"max_lignes":4,"aide":"Le moins possible : prénom et WhatsApp ou email suffisent."},{"cle":"livraison","libelle":"Comment le lead magnet est livré, et le message envoyé","type":"texte_long","obligatoire":true},{"cle":"contacts_test","libelle":"Nombre de contacts récupérés à ce jour (tests compris)","type":"nombre","obligatoire":true}]''',
  ''["Le lien de capture fonctionne (le coach le teste).","La livraison du lead magnet est automatique ou se fait en moins d''une heure.","Au moins un contact a été enregistré."]'',
  ''[{"titre":"Créer votre tunnel de capture","texte":"Systeme.io → Tunnels → Créer → objectif "Construire une audience".","lien_video":""},{"titre":"Construire la page de capture","texte":"Un titre (le titre de votre lead magnet), 3 puces sur ce qu''on y gagne, un formulaire prénom + email ou WhatsApp.","lien_video":""},{"titre":"Livrer le lead magnet automatiquement","texte":"Page de remerciement avec le lien de téléchargement, et un email automatique qui le renvoie.","lien_video":""},{"titre":"Tester","texte":"Inscrivez-vous vous-même depuis votre téléphone et vérifiez que vous recevez bien la ressource.","lien_video":""}]''',
  ''[{"titre":"Rédiger ma page de capture","prompt":"Rédige une page de capture courte, en français simple, lisible sur téléphone, pour ce lead magnet : {{4.1.titre}}. Il résout ce problème : {{4.1.probleme_resolu}}. Il s''adresse à : {{3.1.qui}}. Donne : un titre, un sous-titre, 3 puces sur ce qu''on y gagne, et le texte du bouton."}]''
);
