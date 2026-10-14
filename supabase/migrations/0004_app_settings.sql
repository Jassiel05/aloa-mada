-- =====================================================================
-- Aloa-Mada — paramètres réglables au back-office
-- Prix des abonnements Pro et numéros Mobile Money de réception :
-- modifiables dans /admin › Paramètres, sans toucher au code.
-- Rejouable sans erreur.
-- =====================================================================

create table if not exists public.app_settings (
  id               boolean primary key default true check (id),
  candidate_price  int check (candidate_price >= 0),
  recruiter_price  int check (recruiter_price >= 0),
  payee_name       text,
  mvola_number     text,
  orange_number    text,
  airtel_number    text,
  updated_at       timestamptz not null default now()
);

insert into public.app_settings (id) values (true) on conflict (id) do nothing;

alter table public.app_settings enable row level security;

drop policy if exists "paramètres lisibles" on public.app_settings;
create policy "paramètres lisibles" on public.app_settings for select using (true);

drop policy if exists "admin modifie les paramètres" on public.app_settings;
create policy "admin modifie les paramètres" on public.app_settings for update
  using (public.is_admin()) with check (public.is_admin());

drop trigger if exists app_settings_touch on public.app_settings;
create trigger app_settings_touch before update on public.app_settings
for each row execute function public.touch_updated_at();

grant select on public.app_settings to anon, authenticated, service_role;
grant update on public.app_settings to authenticated, service_role;
