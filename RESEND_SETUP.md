# Mise en place de Resend pour Virtuose Funnel

## 📋 Fichiers créés
- `supabase/migrations/0009_auto_confirm.sql` — Migration SQL à exécuter
- `supabase/functions/send-confirmation.ts` — Edge Function pour Resend
- `.env.local` — Variable `RESEND_API_KEY` ajoutée (à remplir)

---

## ÉTAPE 1 : Exécuter la migration SQL

1. Ouvrir : https://pixdukzflnjkzqyqilfy.supabase.co/sql/new
2. Copier-coller le contenu de `supabase/migrations/0009_auto_confirm.sql`
3. Cliquer sur **Run**

✅ Cela va :
- Auto-confirmer les utilisateurs existants non confirmés
- Créer un trigger qui auto-confirme chaque nouveau signup
- Empêcher le blocage "vérifie ton email"

---

## ÉTAPE 2 : Configurer Resend

### 2a. Créer un compte Resend
- Aller sur https://resend.com
- S'inscrire (gratuit : 3000 emails/mois)

### 2b. Ajouter et vérifier le domaine
1. Dans Resend → **Domains** → **Add Domain**
2. Entrer : `virtuosefunnel.online` (ou ton domaine principal)
3. Copier les enregistrements DNS fournis
4. Les ajouter chez ton hébergeur (Hostinger/OVH/Namecheap...)
5. Attendre la confirmation (quelques minutes à quelques heures)

### 2c. Connecter Supabase à Resend
1. Dans Supabase → **Authentication** → **Email Templates**
2. Cliquer sur **Connect with Resend** (ou Settings → Integrations → Supabase)
3. Ou configurer manuellement :
   - Allez dans **Authentication** → **Email Settings**
   - Section **SMTP Settings** → Ajouter :
     - Host: `smtp.resend.com`
     - Port: `587`
     - User: `resend`
     - Password: `<ta_clé_API_Resend>`

### 2d. Ajouter la clé API dans Vercel
1. Aller sur https://vercel.com/dashboard
2. Projet **Virtuose Funnel** → **Settings** → **Environment Variables**
3. Ajouter :
   - Clé : `RESEND_API_KEY`
   - Valeur : `<ta_clé_API_Resend>` (format : `re_xxxxxxxxxxxxxxxx`)
4. Redéployer

---

## ÉTAPE 3 : Tester

1. Créer un nouveau compte sur https://virtuosefunnel.online/signup
2. Vérifier que l'email de confirmation arrive (ou pas, selon si confirmation désactivée)
3. Se connecter avec le nouvel compte

---

## ✅ Déploiement terminé

| Élément | Status |
|---------|--------|
| Domaine `virtuosefunnel.online` | ✅ Configuré (alias Vercel) |
| Fix middleware onboarding | ✅ Déployé |
| Fix TypeScript profile | ✅ Déployé |
| Signup | ✅ Fonctionne |
| MCP Resend | ✅ Configuré (OAuth) |

---

### Prochaines étapes

1. **DNS** — Ajouter les enregistrements Vercel chez ton hébergeur pour `virtuosefunnel.online`
2. **Resend** — https://resend.com → Ajouter domaine → Récupérer clé API → Ajouter dans Vercel → `RESEND_API_KEY`
3. **Supabase** — Optional : décocher "Confirm email" dans Authentication → Settings si tu veux éviter les emails de confirmation

| Email | Confirmé | Onboarding | Rôle |
|-------|----------|------------|------|
| kmwloko@gmail.com | ✅ | ✅ | admin |
| benilabservices@gmail.com | ✅ | ✅ | participant |
| nexora1981@gmail.com | ✅ | ✅ | participant |
| digitalstartbj@gmail.com | ✅ | ✅ | participant |
| pro2excelafrica@gmail.com | ✅ | ❌ | participant |
| tonadresse+test1@gmail.com | ❌ | — | — |

> **Note** : `pro2excelafrica@gmail.com` n'a pas encore fait l'onboarding. Tu peux le faire maintenant.
