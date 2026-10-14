# aloa-mada

Plateforme de mise en relation directe entre recruteurs et candidats à Madagascar : une galerie de portraits, une fiche par personne, un message en deux clics.

**Stack :** Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage, Realtime) · Resend (emails) · Vercel.

## Ce qui est en place (phase 1)

| Zone | Pages |
| --- | --- |
| Public | Galerie de portraits avec filtres (`/`), vue Recruteurs, offres (`/offres`), tarifs (`/pro`), CGU, confidentialité |
| Compte | Inscription en choisissant son rôle, connexion, profil en 3 étapes avec photo recadrée en 4:5, interrupteur « Disponible / En poste » |
| Contact | Fiche qui s'ouvre sur le côté, premier message, messagerie en temps réel (`/messages`) |
| Offres | Publication (Recruteur Pro), candidature (Candidat Pro), suivi des candidatures des deux côtés |
| Pro | Demande de passage en Pro par Mobile Money (référence de transaction), validation par l'admin |
| Admin | `/admin` : validation des photos et profils, paiements, signalements, membres (plan, badge entreprise) |

## Règles de droits (appliquées dans la base, pas seulement à l'écran)

| Action | Candidat Simple | Candidat Pro | Recruteur Simple | Recruteur Pro |
| --- | --- | --- | --- | --- |
| Voir la galerie et les fiches | oui | oui | oui | oui |
| Voir email et téléphone | **non** | oui | oui | oui |
| Contacter en premier | non → fenêtre Pro | oui | oui | oui |
| Répondre à un message reçu | oui | oui | oui | oui |
| Postuler à une offre | non → fenêtre Pro | oui | — | — |
| Publier une offre | — | — | non → fenêtre Pro | oui |

Tout passe par la fonction SQL `can(action)` et les règles RLS de `supabase/migrations/0001_schema.sql`. Un Pro expiré redevient Simple automatiquement, une nouvelle photo repasse en modération, et un membre ne peut ni changer son plan ni se valider lui-même.

## Installation

### 1. Supabase

1. Créez un projet sur [supabase.com](https://supabase.com). Choisissez une région proche, par exemple Europe (Francfort ou Paris), et notez le mot de passe de la base.
2. Ouvrez **SQL Editor → New query**, collez tout le fichier `supabase/migrations/0001_schema.sql`, puis cliquez sur **Run**. Cela crée les tables, les droits, le stockage des photos et le temps réel.
3. Dans **Authentication → URL Configuration** :
   - Site URL : l'adresse du site (`http://localhost:3000` en local, puis l'URL Vercel ou votre domaine) ;
   - Redirect URLs : ajoutez `http://localhost:3000/auth/callback` et `https://VOTRE-DOMAINE/auth/callback`.
4. Dans **Authentication → Sign In / Providers → Email**, laissez « Confirm email » activé (recommandé contre les faux comptes).
5. Récupérez dans **Project Settings → API** (ou **Data API**) l'URL du projet et la clé `anon` (ou la « publishable key »).
6. Pour devenir admin : inscrivez-vous sur le site avec votre email, puis lancez dans le SQL Editor :

   ```sql
   update public.profiles set role = 'admin', status = 'approved', onboarded = true
   where id = (select id from auth.users where email = 'VOTRE-EMAIL');
   ```

### 2. En local

```bash
cp .env.example .env.local   # puis remplissez les 3 valeurs
npm install
npm run dev
```

### 3. Mise en ligne sur Vercel

1. Importez le dépôt GitHub sur [vercel.com/new](https://vercel.com/new).
2. Ajoutez les variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` et `NEXT_PUBLIC_SITE_URL` (l'URL finale du site).
3. Déployez, puis reportez l'URL dans Supabase (étape 1.3).

### 4. À compléter avant d'ouvrir au public

- `src/lib/pricing.ts` : les prix Pro et vos numéros MVola, Orange Money et Airtel Money.
- `src/app/cgu` et `src/app/confidentialite` : textes juridiques (les parties `[À COMPLÉTER]`).
- Emails Supabase (**Authentication → Emails**) : traduire les modèles en français. Pour plus de 2 à 4 emails par heure, branchez un SMTP (Resend, Brevo…) dans **Authentication → SMTP Settings**.

## Phase 2 : emails, favoris, alertes, vues

| Fonction | Où |
| --- | --- |
| Email à chaque nouveau message (un seul tant que la conversation n'est pas lue) | automatique |
| Email au recruteur à chaque candidature reçue | automatique |
| Email au membre quand son profil est validé ou refusé, et quand son Pro est activé | automatique depuis `/admin` |
| Favoris (cœur sur les fiches et les offres) | `/favoris` |
| Alertes par email : nouveaux talents pour les recruteurs, nouvelles offres pour les candidats | `/alertes` |
| Nombre de vues de sa fiche sur 30 jours | `/profil` |
| Galerie paginée (« Voir plus de profils ») et liens directs vers une fiche (`/?p=…`) | `/` |

### Mise en place

1. Dans Supabase **SQL Editor**, exécutez `supabase/migrations/0002_phase2.sql` (après le 0001).
2. Créez un compte sur [resend.com](https://resend.com), vérifiez votre domaine (**Domains → Add domain**, puis ajoutez les enregistrements DNS indiqués) et créez une clé API.
3. Ajoutez ces variables dans `.env.local` et sur Vercel :
   - `SUPABASE_SERVICE_ROLE_KEY` : Supabase → **Project Settings → API** → clé `service_role` (secrète, jamais dans le navigateur) ;
   - `RESEND_API_KEY` : la clé Resend ;
   - `EMAIL_FROM` : par exemple `Aloa-Mada <bonjour@votre-domaine.com>`.
4. Optionnel mais conseillé : dans Supabase **Authentication → SMTP Settings**, utilisez aussi Resend (hôte `smtp.resend.com`, port 465, utilisateur `resend`, mot de passe = la clé API) pour les emails de confirmation d'inscription.

Sans ces clés, le site fonctionne normalement mais n'envoie aucun email (un message apparaît dans les logs).

## Prochaines étapes

Paiement Mobile Money automatique (API MVola ou agrégateur), mise en avant payante d'une offre, version malgache.
