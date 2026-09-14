insert into stages (number, slug, title, objective, order_index) values
  (1, 'diagnostic', 'Diagnostic', 'Évaluer l''état actuel de votre système de vente.', 1),
  (2, 'offre', 'Offre', 'Transformer votre expertise en une offre claire et désirable.', 2),
  (3, 'cible-positionnement', 'Cible & Positionnement', 'Définir précisément qui vous servez et pourquoi vous.', 3),
  (4, 'lead-magnet', 'Lead Magnet', 'Créer une ressource qui capture vos prospects.', 4),
  (5, 'acquisition', 'Acquisition', 'Mettre en place vos canaux de trafic.', 5),
  (6, 'funnel', 'Mon Funnel', 'Construire un funnel complet de la landing page au checkout.', 6),
  (7, 'conversion-relance', 'Conversion & Relance', 'Optimiser votre page de vente et vos séquences de relance.', 7),
  (8, 'mesure-optimisation', 'Mesure & Optimisation', 'Suivre vos métriques et améliorer en continu.', 8);

insert into missions (stage_id, number, title, objective, estimated_duration_minutes, order_index)
select s.id, s.number, m.title, m.objective, m.duration, s.number
from stages s
join (values
  (1, 'Réaliser mon diagnostic funnel', 'Obtenir mon Funnel Score et mes 3 priorités.', 15),
  (2, 'Construire mon offre irrésistible', 'Transformer mon expertise en une offre claire, désirable et commercialisable.', 90),
  (3, 'Clarifier ma cible et mon positionnement', 'Définir précisément qui je sers et le message qui lui parle.', 60),
  (4, 'Créer mon lead magnet', 'Produire une ressource gratuite qui capture mes premiers prospects.', 120),
  (5, 'Lancer mon premier canal d''acquisition', 'Mettre en place une source de trafic régulière vers mon funnel.', 90),
  (6, 'Construire ma page de vente', 'Créer une page de vente capable de transformer mes prospects en clients.', 150),
  (7, 'Mettre en place ma relance', 'Créer une séquence de relance email ou WhatsApp pour les prospects non convertis.', 90),
  (8, 'Suivre mes métriques clés', 'Mettre en place le suivi de mes leads, ventes et revenu.', 60)
) as m(number, title, objective, duration) on m.number = s.number;
