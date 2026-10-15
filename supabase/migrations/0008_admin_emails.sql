-- =====================================================================
-- Aloa-Mada — accès admin sans SQL
-- Les adresses listées dans admin_emails deviennent admin automatiquement,
-- dès que l'email est confirmé (inscription par email ou connexion Google).
-- Rejouable sans erreur.
-- =====================================================================

create table if not exists public.admin_emails (
  email      text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);
alter table public.admin_emails enable row level security;
-- Aucune règle d'accès : invisible depuis l'API, géré uniquement dans le SQL Editor ou le Table Editor
revoke all on public.admin_emails from anon, authenticated;

insert into public.admin_emails (email) values ('responsable@bex-digital.com') on conflict do nothing;

create or replace function public.promote_admin_email()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email_confirmed_at is not null
     and exists (select 1 from admin_emails where email = lower(new.email)) then
    update profiles set role = 'admin', status = 'approved', onboarded = true
    where id = new.id and role <> 'admin';
  end if;
  return new;
end;
$$;
revoke execute on function public.promote_admin_email() from anon, authenticated;

drop trigger if exists on_auth_user_admin on auth.users;
create trigger on_auth_user_admin after insert or update of email_confirmed_at on auth.users
for each row execute function public.promote_admin_email();

-- Comptes déjà existants et confirmés
update public.profiles p set role = 'admin', status = 'approved', onboarded = true
from auth.users u
where u.id = p.id and u.email_confirmed_at is not null
  and lower(u.email) in (select email from public.admin_emails)
  and p.role <> 'admin';
