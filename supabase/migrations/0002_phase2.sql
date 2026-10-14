-- =====================================================================
-- Aloa-Mada — phase 2 : alertes et vues de profil
-- Appliquée automatiquement par l'intégration GitHub de Supabase (rejouable sans erreur)
-- =====================================================================

-- ---------- Alertes ---------------------------------------------------
-- Un recruteur est prévenu quand un talent correspondant est validé,
-- un candidat quand une offre correspondante est publiée.
create table if not exists public.alerts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  target     text not null check (target in ('talents', 'offers')),
  keyword    text check (char_length(keyword) <= 80),
  city       text,
  contract   text,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_alerts_target_active on public.alerts (target, active);

alter table public.alerts enable row level security;

drop policy if exists "ses alertes" on public.alerts;
create policy "ses alertes" on public.alerts for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 10 alertes maximum par membre
create or replace function public.limit_alerts()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from alerts where user_id = new.user_id) >= 10 then
    raise exception 'alert_limit';
  end if;
  return new;
end;
$$;

drop trigger if exists alerts_limit on public.alerts;
create trigger alerts_limit before insert on public.alerts
for each row execute function public.limit_alerts();

-- ---------- Vues de profil -------------------------------------------
-- Une vue par visiteur connecté et par jour, jamais la sienne.
create table if not exists public.profile_views (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  viewer_id  uuid not null references public.profiles (id) on delete cascade,
  day        date not null default current_date,
  primary key (profile_id, viewer_id, day)
);

alter table public.profile_views enable row level security;

drop policy if exists "voir les vues de son profil" on public.profile_views;
create policy "voir les vues de son profil" on public.profile_views for select
  using (profile_id = auth.uid() or public.is_admin());

create or replace function public.record_view(target uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or auth.uid() = target then return; end if;
  insert into profile_views (profile_id, viewer_id) values (target, auth.uid())
  on conflict do nothing;
end;
$$;

-- Nombre de vues des 30 derniers jours (pour la page Mon profil)
create or replace function public.my_view_count()
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from profile_views
  where profile_id = auth.uid() and day > current_date - 30;
$$;
