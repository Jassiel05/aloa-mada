-- =====================================================================
-- Aloa-Mada — droits d'accès de l'API
-- Les nouveaux projets Supabase peuvent ne plus donner accès automatiquement
-- aux tables créées par les migrations. On donne donc les droits explicitement :
-- la sécurité ligne par ligne (RLS) reste ce qui protège réellement les données.
-- =====================================================================

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;

-- Les fonctions internes des déclencheurs ne doivent pas être appelables depuis l'API
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.guard_profile() from anon, authenticated;
revoke execute on function public.guard_recruiter_details() from anon, authenticated;
revoke execute on function public.bump_conversation() from anon, authenticated;
revoke execute on function public.limit_alerts() from anon, authenticated;
revoke execute on function public.touch_updated_at() from anon, authenticated;
-- Seul un admin peut valider un paiement (la fonction le vérifie aussi)
revoke execute on function public.approve_upgrade(uuid) from anon;

-- Même règle pour tout ce qui sera créé plus tard par les migrations
alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges in schema public grant usage, select on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
