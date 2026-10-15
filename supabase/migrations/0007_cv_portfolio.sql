-- =====================================================================
-- Aloa-Mada — CV (PDF) et lien portfolio des candidats
-- Le CV est stocké dans un espace privé : seuls la personne elle-même,
-- les recruteurs, les membres Pro et l'admin peuvent l'ouvrir
-- (même règle que l'email et le téléphone, voir can('see_contacts')).
-- Rejouable sans erreur.
-- =====================================================================

alter table public.candidate_details
  add column if not exists cv_path       text,
  add column if not exists cv_size       int,
  add column if not exists cv_updated_at timestamptz;

-- Le CV est forcément rangé dans le dossier de son propriétaire
do $$ begin
  alter table public.candidate_details
    add constraint candidate_cv_own_folder check (cv_path is null or cv_path like profile_id::text || '/%') not valid;
exception when duplicate_object then null; end $$;

-- Liens : uniquement http(s), jamais de « javascript: » ou autre
do $$ begin
  alter table public.candidate_details
    add constraint candidate_portfolio_http check (portfolio_url is null or portfolio_url ~* '^https?://[^\s]+$') not valid;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.recruiter_details
    add constraint recruiter_website_http check (website is null or website ~* '^https?://[^\s]+$') not valid;
exception when duplicate_object then null; end $$;

-- ---------- Espace de stockage privé des CV (2 Mo max après compression) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cvs', 'cvs', false, 2097152, array['application/pdf'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "CV lisibles" on storage.objects;
create policy "CV lisibles" on storage.objects for select
  using (bucket_id = 'cvs' and ((storage.foldername(name))[1] = auth.uid()::text or public.can('see_contacts')));
drop policy if exists "déposer son CV" on storage.objects;
create policy "déposer son CV" on storage.objects for insert
  with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "remplacer son CV" on storage.objects;
create policy "remplacer son CV" on storage.objects for update
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "supprimer son CV" on storage.objects;
create policy "supprimer son CV" on storage.objects for delete
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);

-- Les photos sont compressées dans le navigateur (moins de 150 Ko) : 1 Mo suffit largement
update storage.buckets set file_size_limit = 1048576 where id = 'avatars';
