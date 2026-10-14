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

## Installation (tout est automatique depuis GitHub)

Le dépôt contient tout ce qu'il faut : le code du site (`src/`), la base de données (`supabase/migrations/`) et la configuration Supabase (`supabase/config.toml`). Chaque push sur `main` met à jour la base **et** le site.

### 1. Relier Supabase au dépôt

1. Créez un projet sur [supabase.com](https://supabase.com) (région Europe, par exemple).
2. **Project Settings → Integrations → GitHub** : connectez le dépôt `Jassiel05/aloa-mada`.
   - *Supabase directory* : `.` (le dossier `supabase/` est à la racine) ;
   - *Production branch* : `main` ;
   - activez **Deploy to production**.
3. À chaque push sur `main`, Supabase applique les nouvelles migrations (`0001` → `0002` → `0003`) et crée le stockage des photos.

> Ne collez pas le SQL à la main dans le SQL Editor si l'intégration est active : les tables existeraient déjà et la migration échouerait.

### 2. Relier Vercel (variables d'environnement automatiques)

1. Sur [vercel.com/new](https://vercel.com/new), importez `Jassiel05/aloa-mada` (framework détecté : Next.js). Vercel redéploie à chaque push sur `main`.
2. Dans Supabase : **Project Settings → Integrations → Vercel** → connectez ce projet Vercel. Supabase y ajoute tout seul `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY`.
3. L'adresse du site est détectée automatiquement sur Vercel. `NEXT_PUBLIC_SITE_URL` ne sert que si vous branchez votre propre nom de domaine.
4. Emails : ajoutez `RESEND_API_KEY` et `EMAIL_FROM` dans **Vercel → Settings → Environment Variables** (ou installez l'intégration Resend depuis le Marketplace Vercel), puis redéployez.

### 3. Réglages Supabase à faire une seule fois

L'intégration GitHub ne pousse pas les réglages d'authentification. Dans **Authentication → URL Configuration** :
- *Site URL* : l'adresse Vercel du site (ex. `https://aloa-mada.vercel.app`) ;
- *Redirect URLs* : `https://aloa-mada.vercel.app/auth/callback`, `https://*.vercel.app/auth/callback` et `http://localhost:3000/auth/callback`.

Pour devenir admin : inscrivez-vous sur le site, puis lancez dans le SQL Editor :

```sql
update public.profiles set role = 'admin', status = 'approved', onboarded = true
where id = (select id from auth.users where email = 'VOTRE-EMAIL');
```

### En local (facultatif)

```bash
cp .env.example .env.local   # puis remplissez les valeurs
npm install
npm run dev
```

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

La migration `0002_phase2.sql` est appliquée automatiquement par l'intégration GitHub. Pour les emails, créez un compte sur [resend.com](https://resend.com), vérifiez votre domaine (**Domains → Add domain** + enregistrements DNS), puis ajoutez `RESEND_API_KEY` et `EMAIL_FROM` dans Vercel (étape 2.4 ci-dessus). Conseillé : dans Supabase **Authentication → SMTP Settings**, utilisez aussi Resend (hôte `smtp.resend.com`, port 465, utilisateur `resend`, mot de passe = la clé API) pour les emails de confirmation d'inscription.

Sans ces clés, le site fonctionne normalement mais n'envoie aucun email (un message apparaît dans les logs).

## Prochaines étapes

Paiement Mobile Money automatique (API MVola ou agrégateur), mise en avant payante d'une offre, version malgache.
