-- =====================================================================
-- Aloa-Mada — informations légales et contact, réglables au back-office
-- Affichées dans le pied de page, les CGU et la politique de confidentialité.
-- Rejouable sans erreur.
-- =====================================================================

alter table public.app_settings add column if not exists publisher_name    text;
alter table public.app_settings add column if not exists publisher_address text;
alter table public.app_settings add column if not exists publisher_ids     text;  -- NIF, STAT, RCS
alter table public.app_settings add column if not exists contact_email     text;
alter table public.app_settings add column if not exists contact_phone     text;

-- Droits inchangés (0004) : lecture pour tous, modification par l'admin seulement.
grant select on public.app_settings to anon, authenticated, service_role;
grant update on public.app_settings to authenticated, service_role;
