-- =====================================================================
-- Aloa-Mada — numéro MVola de réception des paiements Pro
-- Renseigné seulement s'il est encore vide : une valeur saisie dans
-- /admin › Paramètres n'est jamais écrasée. Rejouable sans erreur.
-- =====================================================================

insert into public.app_settings (id) values (true) on conflict (id) do nothing;

update public.app_settings
set mvola_number = '034 88 905 46'
where id and (mvola_number is null or btrim(mvola_number) = '');
