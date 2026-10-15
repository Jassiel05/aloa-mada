-- =====================================================================
-- Aloa-Mada — connexion avec Google et Apple
-- Le prénom est repris du compte Google / Apple (given_name, full_name ou name)
-- quand la personne ne passe pas par le formulaire d'inscription.
-- Rejouable sans erreur.
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta   jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  wanted text := coalesce(meta ->> 'role', 'candidate');
  first  text := nullif(trim(coalesce(
                   meta ->> 'first_name',
                   meta ->> 'given_name',
                   split_part(coalesce(meta ->> 'full_name', meta ->> 'name', ''), ' ', 1)
                 )), '');
  last   text := nullif(trim(coalesce(
                   meta ->> 'last_name',
                   meta ->> 'family_name',
                   nullif(substr(coalesce(meta ->> 'full_name', meta ->> 'name', ''),
                                 length(split_part(coalesce(meta ->> 'full_name', meta ->> 'name', ''), ' ', 1)) + 2), '')
                 )), '');
begin
  insert into profiles (id, role, first_name, last_name)
  values (
    new.id,
    case when wanted = 'recruiter' then 'recruiter'::user_role else 'candidate'::user_role end,
    first,
    last
  );
  insert into profile_contacts (profile_id, email) values (new.id, new.email);
  return new;
end;
$$;

-- Fonction interne : jamais appelable depuis l'API (comme en 0003)
revoke execute on function public.handle_new_user() from anon, authenticated;
