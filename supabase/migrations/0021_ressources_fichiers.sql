-- Migration 0021 : ressources de type « fichier » (PDF réservés aux abonnés)
-- Les fichiers sont dans un bucket Storage privé : aucune politique d'accès,
-- seul le serveur (clé service_role) génère un lien signé après avoir vérifié
-- l'abonnement (route /api/ressources/[slug]/fichier).
-- ============================================================

alter table resources add column if not exists file_path text;

alter table resources drop constraint if exists resources_type_check;
alter table resources add constraint resources_type_check
  check (type in ('guide', 'lien', 'fichier'));

alter table resources drop constraint if exists resources_content_matches_type;
alter table resources add constraint resources_content_matches_type check (
  (type = 'guide' and content_blocks is not null and external_url is null and file_path is null) or
  (type = 'lien' and external_url is not null and content_blocks is null and file_path is null) or
  (type = 'fichier' and file_path is not null and content_blocks is null and external_url is null)
);

insert into storage.buckets (id, name, public)
values ('ressources', 'ressources', false)
on conflict (id) do nothing;

-- Pack WhatsApp Cash System™ offert aux membres
insert into resources (stage_id, slug, title, description, type, file_path, order_index) values
  (null, 'whatsapp-cash-system',
   $txt$Offert : WhatsApp Cash System™$txt$,
   $txt$Le guide complet pour vendre sur WhatsApp : profil, conversation qui vend, prospection sans pub, relances, fidélisation. Vendu 9 999 FCFA sur notre boutique, offert aux membres.$txt$,
   'fichier', 'whatsapp-cash-system/WhatsApp_Cash_System.pdf', 1),
  ((select id from stages where number = 5), 'whatsapp-kit-lancement-express',
   $txt$Kit de lancement WhatsApp Express™$txt$,
   $txt$30 jours de statuts, messages et mini-campagnes prêts à copier pour attirer des conversations sans publicité.$txt$,
   'fichier', 'whatsapp-cash-system/Kit_Lancement_WhatsApp_Express.pdf', 10),
  ((select id from stages where number = 7), 'whatsapp-scripts-vault',
   $txt$WhatsApp Scripts Vault™ : 120 messages prêts à envoyer$txt$,
   $txt$Ouverture, qualification, présentation de l'offre, relance douce et fidélisation, plus 3 séquences complètes. À utiliser pour les missions 7.1 et 7.2.$txt$,
   'fichier', 'whatsapp-cash-system/WhatsApp_Scripts_Vault.pdf', 10),
  ((select id from stages where number = 8), 'whatsapp-automatisation-notion-chatgpt',
   $txt$Automatiser son suivi avec Notion et ChatGPT$txt$,
   $txt$Un tableau de bord Notion pour suivre prospects, relances et ventes, et 5 prompts ChatGPT pour rédiger vos messages.$txt$,
   'fichier', 'whatsapp-cash-system/Automatisation_Notion_ChatGPT.pdf', 10)
on conflict (slug) do nothing;
