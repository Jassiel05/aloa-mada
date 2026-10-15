-- =====================================================================
-- Aloa-Mada — photo facultative et recherche tolérante aux fautes
-- 1. Un membre peut masquer sa photo : une silhouette homme / femme s'affiche à la place.
-- 2. La recherche par métier trouve « electricien », « électricein », « comptabl »… :
--    sans accents, sans majuscules, et par ressemblance (pg_trgm).
-- Rejouable sans erreur.
-- =====================================================================

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

alter table public.profiles
  add column if not exists gender       text check (gender in ('homme', 'femme')),
  add column if not exists photo_hidden boolean not null default false;

-- Métier et compétences comparés sans accents ni majuscules, par ressemblance
create or replace function public.search_talents(q text)
returns setof uuid
language sql stable
set search_path = public, extensions
as $$
  with t as (select lower(extensions.unaccent(btrim(coalesce(q, '')))) as q)
  select c.profile_id
  from candidate_details c, t
  where length(t.q) >= 2 and (
       lower(extensions.unaccent(coalesce(c.job_title, ''))) like '%' || t.q || '%'
    or extensions.word_similarity(t.q, lower(extensions.unaccent(coalesce(c.job_title, '')))) >= 0.45
    or exists (
         select 1 from unnest(c.skills) s
         where lower(extensions.unaccent(s)) like '%' || t.q || '%'
            or extensions.word_similarity(t.q, lower(extensions.unaccent(s))) >= 0.5
       )
  )
  limit 300;
$$;

-- Fonction « security invoker » : les règles RLS de candidate_details s'appliquent
grant execute on function public.search_talents(text) to anon, authenticated;
