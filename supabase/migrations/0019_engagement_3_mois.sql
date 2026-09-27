-- Migration 0019 : Engagement 3 mois — colonnes mode_paiement, echeance, engagement_fin
-- ============================================================

-- 1. Ajouter les nouvelles colonnes à la table subscriptions
ALTER TABLE subscriptions ADD COLUMN mode_paiement text NOT NULL DEFAULT 'mensuel'
  CHECK (mode_paiement IN ('mensuel', 'une_fois', 'admin'));

ALTER TABLE subscriptions ADD COLUMN echeance integer;

ALTER TABLE subscriptions ADD COLUMN engagement_fin timestamptz;

-- 2. Remplir les lignes existantes
-- admin-grant- : mode_paiement = 'admin'
-- autres : mode_paiement = 'mensuel', echeance = 1
-- engagement_fin = created_at + 90 jours (ou expires_at + 60 jours si created_at n'existe pas)
UPDATE subscriptions SET
  mode_paiement = CASE
    WHEN cartflox_order_id LIKE 'admin-grant-%' THEN 'admin'
    ELSE 'mensuel'
  END,
  echeance = CASE
    WHEN cartflox_order_id LIKE 'admin-grant-%' THEN NULL
    ELSE 1
  END,
  engagement_fin = COALESCE(
    created_at + INTERVAL '90 days',
    expires_at + INTERVAL '60 days'
  );
