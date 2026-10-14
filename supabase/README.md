# Migrations Supabase — Aloa-Mada

## État des migrations

| Version | Fichier | Contenu |
|---------|---------|---------|
| `0001` | `migrations/0001_schema.sql` | Schéma initial : profils, coordonnées séparées, détails candidat / recruteur, offres, candidatures, messagerie, demandes Pro, signalements, favoris ; fonction `can()`, règles RLS, bucket `avatars`, temps réel des messages |
| `0002` | `migrations/0002_phase2.sql` | Alertes par email (talents / offres, 10 max.) et vues de profil (une par visiteur et par jour) |
| `0003` | `migrations/0003_grants.sql` | Droits d'accès de l'API explicites ; fonctions internes non appelables depuis l'API |
| `0004` | `migrations/0004_app_settings.sql` | Paramètres réglables au back-office : prix Pro candidat / recruteur, bénéficiaire et numéros MVola, Orange Money, Airtel Money |

## Application

Les migrations sont appliquées automatiquement, dans l'ordre, par l'intégration GitHub de
Supabase à chaque push sur `main`. En cas de besoin, elles peuvent aussi être exécutées à la main
dans le **SQL Editor**, dans l'ordre.
Toutes sont **rejouables** : les exécuter une deuxième fois ne provoque pas d'erreur.

Si une migration a été passée à la main avant de brancher l'intégration GitHub, l'enregistrer
pour qu'elle ne soit pas rejouée (exemple pour `0001`) :

```sql
insert into supabase_migrations.schema_migrations (version, name)
values ('0001', 'schema')
on conflict (version) do nothing;
```

## Accès au back-office

Créer d'abord son compte sur le site, puis, une seule fois, dans le SQL Editor :

```sql
update public.profiles set role = 'admin', status = 'approved', onboarded = true
where id = (select id from auth.users where email = 'votre-email@exemple.com');
```

Le lien « Admin » apparaît alors dans le menu (`/admin`). Pour tout autre compte, cette adresse
renvoie une page 404. Les prix et les numéros Mobile Money se règlent ensuite dans
**/admin › Paramètres**.

## Règles pour les prochaines migrations

- Un fichier par évolution (`0005_<description>.sql`, …), sans jamais modifier une migration
  déjà appliquée en production.
- **Toute nouvelle table reçoit ses `GRANT` explicites** (voir `0003`), en plus de sa RLS.
- Écrire des scripts rejouables : `create table if not exists`, `on conflict do nothing`,
  `drop policy if exists` avant `create policy`, `drop trigger if exists` avant `create trigger`.
