-- =====================================================================
-- Aloa-Mada — schéma complet (appliqué automatiquement par l'intégration GitHub, rejouable sans erreur)
-- =====================================================================

-- ---------- Types ----------------------------------------------------
do $$ begin create type public.user_role as enum ('candidate', 'recruiter', 'admin'); exception when duplicate_object then null; end $$;
do $$ begin create type public.user_plan as enum ('simple', 'pro'); exception when duplicate_object then null; end $$;
do $$ begin create type public.moderation_status as enum ('draft', 'pending', 'approved', 'rejected'); exception when duplicate_object then null; end $$;
do $$ begin create type public.availability as enum ('available', 'available_from', 'employed'); exception when duplicate_object then null; end $$;
do $$ begin create type public.rate_unit as enum ('hour', 'day', 'month', 'project', 'negotiable'); exception when duplicate_object then null; end $$;
do $$ begin create type public.recruiter_kind as enum ('individual', 'company'); exception when duplicate_object then null; end $$;
do $$ begin create type public.offer_status as enum ('open', 'closed'); exception when duplicate_object then null; end $$;
do $$ begin create type public.application_status as enum ('sent', 'seen', 'shortlisted', 'rejected'); exception when duplicate_object then null; end $$;
do $$ begin create type public.request_status as enum ('pending', 'approved', 'rejected'); exception when duplicate_object then null; end $$;

-- ---------- Tables ---------------------------------------------------
create table if not exists public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  role             public.user_role not null default 'candidate',
  plan             public.user_plan not null default 'simple',
  plan_expires_at  timestamptz,
  status           public.moderation_status not null default 'draft',
  rejection_reason text,
  first_name       text,
  last_name        text,
  city             text,
  photo_path       text,
  headline         text check (char_length(headline) <= 160),
  onboarded        boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Coordonnées séparées : jamais visibles par un candidat Simple
create table if not exists public.profile_contacts (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  email      text,
  phone      text,
  whatsapp   text
);

create table if not exists public.candidate_details (
  profile_id       uuid primary key references public.profiles (id) on delete cascade,
  job_title        text,
  skills           text[] not null default '{}',
  experience_years int check (experience_years between 0 and 60),
  languages        text[] not null default '{}',
  contract_types   text[] not null default '{}',  -- cdi, cdd, freelance, part_time, internship, daily
  rate_amount      numeric(14, 2),
  rate_currency    text not null default 'MGA' check (rate_currency in ('MGA', 'EUR')),
  rate_unit        public.rate_unit not null default 'negotiable',
  availability     public.availability not null default 'available',
  available_from   date,
  work_modes       text[] not null default '{}',  -- onsite, remote, hybrid
  bio              text check (char_length(bio) <= 1200),
  portfolio_url    text,
  notice_period    text,
  school           text
);

create table if not exists public.recruiter_details (
  profile_id   uuid primary key references public.profiles (id) on delete cascade,
  kind         public.recruiter_kind not null default 'individual',
  company_name text,
  sector       text,
  company_size text,
  website      text,
  nif_stat     text,
  verified     boolean not null default false,
  looking_for  text check (char_length(looking_for) <= 600)
);

create table if not exists public.offers (
  id            uuid primary key default gen_random_uuid(),
  recruiter_id  uuid not null references public.profiles (id) on delete cascade,
  title         text not null check (char_length(title) between 3 and 120),
  job_title     text,
  contract_type text not null,
  rate_amount   numeric(14, 2),
  rate_currency text not null default 'MGA' check (rate_currency in ('MGA', 'EUR')),
  rate_unit     public.rate_unit not null default 'negotiable',
  city          text,
  work_mode     text,
  start_date    date,
  description   text not null check (char_length(description) <= 3000),
  status        public.offer_status not null default 'open',
  expires_at    timestamptz not null default now() + interval '30 days',
  created_at    timestamptz not null default now()
);

create table if not exists public.applications (
  id           uuid primary key default gen_random_uuid(),
  offer_id     uuid not null references public.offers (id) on delete cascade,
  candidate_id uuid not null references public.profiles (id) on delete cascade,
  message      text check (char_length(message) <= 1500),
  status       public.application_status not null default 'sent',
  created_at   timestamptz not null default now(),
  unique (offer_id, candidate_id)
);

create table if not exists public.conversations (
  id              uuid primary key default gen_random_uuid(),
  user_a          uuid not null references public.profiles (id) on delete cascade,
  user_b          uuid not null references public.profiles (id) on delete cascade,
  started_by      uuid not null references public.profiles (id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  check (user_a < user_b),
  unique (user_a, user_b)
);

create table if not exists public.messages (
  id              bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id       uuid not null references public.profiles (id) on delete cascade,
  body            text not null check (char_length(body) between 1 and 4000),
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);

create table if not exists public.upgrade_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  months      int not null default 1 check (months between 1 and 12),
  operator    text not null check (operator in ('mvola', 'orange', 'airtel')),
  reference   text not null check (char_length(reference) between 3 and 80),
  amount      numeric(14, 2),
  status      public.request_status not null default 'pending',
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.reports (
  id                uuid primary key default gen_random_uuid(),
  reporter_id       uuid not null references public.profiles (id) on delete cascade,
  target_profile_id uuid references public.profiles (id) on delete cascade,
  target_offer_id   uuid references public.offers (id) on delete cascade,
  reason            text not null check (char_length(reason) between 3 and 1000),
  status            public.request_status not null default 'pending',
  created_at        timestamptz not null default now()
);

create table if not exists public.favorites (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete cascade,
  offer_id   uuid references public.offers (id) on delete cascade,
  created_at timestamptz not null default now(),
  check ((profile_id is null) <> (offer_id is null)),
  unique (user_id, profile_id),
  unique (user_id, offer_id)
);

create index if not exists idx_profiles_status_role on public.profiles (status, role);
create index if not exists idx_candidate_details_availability on public.candidate_details (availability);
create index if not exists idx_offers_status_expires_at on public.offers (status, expires_at);
create index if not exists idx_messages_conversation_id_created_at on public.messages (conversation_id, created_at);
create index if not exists idx_conversations_user_a on public.conversations (user_a);
create index if not exists idx_conversations_user_b on public.conversations (user_b);

-- ---------- Fonctions de droits -------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- Plan réel : un Pro expiré redevient Simple automatiquement
create or replace function public.effective_plan(uid uuid)
returns public.user_plan language sql stable security definer set search_path = public as $$
  select case
    when p.role = 'admin' then 'pro'::user_plan
    when p.plan = 'pro' and (p.plan_expires_at is null or p.plan_expires_at > now()) then 'pro'::user_plan
    else 'simple'::user_plan end
  from profiles p where p.id = uid;
$$;

-- Source unique de vérité des droits (utilisée par RLS ET par l'interface)
create or replace function public.can(action text)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  r public.user_role;
  s public.moderation_status;
  pro boolean;
begin
  select role, status into r, s from profiles where id = auth.uid();
  if r is null then return false; end if;
  if r = 'admin' then return true; end if;
  pro := public.effective_plan(auth.uid()) = 'pro';
  return case action
    when 'apply'              then r = 'candidate' and pro and s = 'approved'
    when 'start_conversation' then s = 'approved' and (r = 'recruiter' or (r = 'candidate' and pro))
    when 'publish_offer'      then r = 'recruiter' and pro and s = 'approved'
    when 'see_contacts'       then r = 'recruiter' or (r = 'candidate' and pro)
    else false
  end;
end;
$$;

-- ---------- Triggers -------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
for each row execute function public.touch_updated_at();

-- Création automatique du profil à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  wanted text := coalesce(new.raw_user_meta_data ->> 'role', 'candidate');
begin
  insert into profiles (id, role, first_name)
  values (
    new.id,
    case when wanted = 'recruiter' then 'recruiter'::user_role else 'candidate'::user_role end,
    new.raw_user_meta_data ->> 'first_name'
  );
  insert into profile_contacts (profile_id, email) values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- Un utilisateur ne peut pas changer son plan, son rôle ou se valider lui-même
create or replace function public.guard_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then return new; end if;
  new.plan := old.plan;
  new.plan_expires_at := old.plan_expires_at;
  new.rejection_reason := old.rejection_reason;
  if old.onboarded or new.role = 'admin' then new.role := old.role; end if;
  -- l'utilisateur peut seulement soumettre son profil (draft/rejected -> pending)
  if new.status <> old.status and not (new.status = 'pending' and old.status in ('draft', 'rejected')) then
    new.status := old.status;
  end if;
  -- une nouvelle photo repasse en modération
  if old.status = 'approved' and new.photo_path is distinct from old.photo_path then
    new.status := 'pending';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before update on public.profiles
for each row execute function public.guard_profile();

create or replace function public.guard_recruiter_details()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then return new; end if;
  if tg_op = 'INSERT' then new.verified := false; else new.verified := old.verified; end if;
  return new;
end;
$$;

drop trigger if exists recruiter_details_guard on public.recruiter_details;
create trigger recruiter_details_guard before insert or update on public.recruiter_details
for each row execute function public.guard_recruiter_details();

-- ---------- Actions métier (RPC) ------------------------------------
-- Premier contact : réservé aux recruteurs et aux candidats Pro, 30 par jour
create or replace function public.start_conversation(other uuid, first_message text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  a uuid; b uuid; conv uuid;
  today_count int;
begin
  if me is null then raise exception 'not_authenticated'; end if;
  if other = me then raise exception 'self_contact'; end if;

  a := least(me, other); b := greatest(me, other);
  select id into conv from conversations where user_a = a and user_b = b;

  if conv is null then
    if not public.can('start_conversation') then raise exception 'upgrade_required'; end if;
    if not exists (select 1 from profiles where id = other and status = 'approved') then
      raise exception 'profile_unavailable';
    end if;
    if exists (select 1 from candidate_details where profile_id = other and availability = 'employed') then
      raise exception 'profile_employed';
    end if;
    select count(*) into today_count from conversations
      where started_by = me and created_at > now() - interval '1 day';
    if today_count >= 30 and not public.is_admin() then raise exception 'daily_limit'; end if;
    insert into conversations (user_a, user_b, started_by) values (a, b, me) returning id into conv;
  end if;

  insert into messages (conversation_id, sender_id, body) values (conv, me, first_message);
  update conversations set last_message_at = now() where id = conv;
  return conv;
end;
$$;

create or replace function public.bump_conversation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end; $$;

drop trigger if exists messages_bump on public.messages;
create trigger messages_bump after insert on public.messages
for each row execute function public.bump_conversation();

-- Validation d'un paiement Mobile Money par l'admin
create or replace function public.approve_upgrade(request uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  req upgrade_requests;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  select * into req from upgrade_requests where id = request and status = 'pending';
  if req.id is null then raise exception 'not_found'; end if;
  update profiles set
    plan = 'pro',
    plan_expires_at = greatest(coalesce(plan_expires_at, now()), now()) + make_interval(months => req.months)
  where id = req.user_id;
  update upgrade_requests set status = 'approved', reviewed_at = now() where id = request;
end;
$$;

-- ---------- Row Level Security --------------------------------------
alter table public.profiles          enable row level security;
alter table public.profile_contacts  enable row level security;
alter table public.candidate_details enable row level security;
alter table public.recruiter_details enable row level security;
alter table public.offers            enable row level security;
alter table public.applications      enable row level security;
alter table public.conversations     enable row level security;
alter table public.messages          enable row level security;
alter table public.upgrade_requests  enable row level security;
alter table public.reports           enable row level security;
alter table public.favorites         enable row level security;

-- profiles
drop policy if exists "profils approuvés visibles" on public.profiles;
create policy "profils approuvés visibles" on public.profiles for select
  using (status = 'approved' or id = auth.uid() or public.is_admin()
         or exists (select 1 from conversations c where (c.user_a = auth.uid() and c.user_b = profiles.id)
                                                     or (c.user_b = auth.uid() and c.user_a = profiles.id)));
drop policy if exists "modifier son profil" on public.profiles;
create policy "modifier son profil" on public.profiles for update
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
drop policy if exists "admin supprime" on public.profiles;
create policy "admin supprime" on public.profiles for delete using (public.is_admin());

-- coordonnées : soi-même, admin, recruteurs et candidats Pro
drop policy if exists "voir les coordonnées" on public.profile_contacts;
create policy "voir les coordonnées" on public.profile_contacts for select
  using (profile_id = auth.uid() or public.is_admin()
         or (public.can('see_contacts')
             and exists (select 1 from profiles p where p.id = profile_id and p.status = 'approved')));
drop policy if exists "écrire ses coordonnées" on public.profile_contacts;
create policy "écrire ses coordonnées" on public.profile_contacts for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- détails candidat / recruteur
drop policy if exists "détails candidat visibles" on public.candidate_details;
create policy "détails candidat visibles" on public.candidate_details for select
  using (profile_id = auth.uid() or public.is_admin()
         or exists (select 1 from profiles p where p.id = profile_id and p.status = 'approved'));
drop policy if exists "écrire ses détails candidat" on public.candidate_details;
create policy "écrire ses détails candidat" on public.candidate_details for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

drop policy if exists "détails recruteur visibles" on public.recruiter_details;
create policy "détails recruteur visibles" on public.recruiter_details for select
  using (profile_id = auth.uid() or public.is_admin()
         or exists (select 1 from profiles p where p.id = profile_id and p.status = 'approved'));
drop policy if exists "écrire ses détails recruteur" on public.recruiter_details;
create policy "écrire ses détails recruteur" on public.recruiter_details for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- offres
drop policy if exists "offres ouvertes visibles" on public.offers;
create policy "offres ouvertes visibles" on public.offers for select
  using ((status = 'open' and expires_at > now()) or recruiter_id = auth.uid() or public.is_admin());
drop policy if exists "publier une offre (Pro)" on public.offers;
create policy "publier une offre (Pro)" on public.offers for insert
  with check (recruiter_id = auth.uid() and public.can('publish_offer'));
drop policy if exists "gérer ses offres" on public.offers;
create policy "gérer ses offres" on public.offers for update
  using (recruiter_id = auth.uid() or public.is_admin());
drop policy if exists "supprimer ses offres" on public.offers;
create policy "supprimer ses offres" on public.offers for delete
  using (recruiter_id = auth.uid() or public.is_admin());

-- candidatures
drop policy if exists "voir ses candidatures" on public.applications;
create policy "voir ses candidatures" on public.applications for select
  using (candidate_id = auth.uid() or public.is_admin()
         or exists (select 1 from offers o where o.id = offer_id and o.recruiter_id = auth.uid()));
drop policy if exists "postuler (Pro)" on public.applications;
create policy "postuler (Pro)" on public.applications for insert
  with check (candidate_id = auth.uid() and public.can('apply')
              and exists (select 1 from offers o where o.id = offer_id and o.status = 'open' and o.expires_at > now()));
drop policy if exists "le recruteur change le statut" on public.applications;
create policy "le recruteur change le statut" on public.applications for update
  using (exists (select 1 from offers o where o.id = offer_id and o.recruiter_id = auth.uid()));

-- conversations (création uniquement via start_conversation)
drop policy if exists "voir ses conversations" on public.conversations;
create policy "voir ses conversations" on public.conversations for select
  using (auth.uid() in (user_a, user_b) or public.is_admin());

-- messages : tout participant peut répondre, même un candidat Simple
drop policy if exists "lire ses messages" on public.messages;
create policy "lire ses messages" on public.messages for select
  using (exists (select 1 from conversations c where c.id = conversation_id and auth.uid() in (c.user_a, c.user_b))
         or public.is_admin());
drop policy if exists "répondre dans ses conversations" on public.messages;
create policy "répondre dans ses conversations" on public.messages for insert
  with check (sender_id = auth.uid()
              and exists (select 1 from conversations c where c.id = conversation_id and auth.uid() in (c.user_a, c.user_b)));
drop policy if exists "marquer comme lu" on public.messages;
create policy "marquer comme lu" on public.messages for update
  using (exists (select 1 from conversations c where c.id = conversation_id and auth.uid() in (c.user_a, c.user_b)));

-- demandes de passage en Pro
drop policy if exists "voir ses demandes" on public.upgrade_requests;
create policy "voir ses demandes" on public.upgrade_requests for select
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists "demander le Pro" on public.upgrade_requests;
create policy "demander le Pro" on public.upgrade_requests for insert
  with check (user_id = auth.uid() and status = 'pending');
drop policy if exists "admin traite" on public.upgrade_requests;
create policy "admin traite" on public.upgrade_requests for update using (public.is_admin());

-- signalements
drop policy if exists "signaler" on public.reports;
create policy "signaler" on public.reports for insert with check (reporter_id = auth.uid());
drop policy if exists "admin lit les signalements" on public.reports;
create policy "admin lit les signalements" on public.reports for select using (public.is_admin());
drop policy if exists "admin traite les signalements" on public.reports;
create policy "admin traite les signalements" on public.reports for update using (public.is_admin());

-- favoris
drop policy if exists "ses favoris" on public.favorites;
create policy "ses favoris" on public.favorites for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- Stockage des photos -------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "photos lisibles" on storage.objects;
create policy "photos lisibles" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "déposer sa photo" on storage.objects;
create policy "déposer sa photo" on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "remplacer sa photo" on storage.objects;
create policy "remplacer sa photo" on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "supprimer sa photo" on storage.objects;
create policy "supprimer sa photo" on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- Temps réel pour la messagerie ---------------------------
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
