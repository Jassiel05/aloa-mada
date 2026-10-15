-- =====================================================================
-- Aloa-Mada — deuxième admin : andrianjakasantatra22@gmail.com
-- Rejouable sans erreur.
-- =====================================================================

insert into public.admin_emails (email) values ('andrianjakasantatra22@gmail.com') on conflict do nothing;

-- Compte déjà créé et confirmé : promu tout de suite
update public.profiles p set role = 'admin', status = 'approved', onboarded = true
from auth.users u
where u.id = p.id and u.email_confirmed_at is not null
  and lower(u.email) in (select email from public.admin_emails)
  and p.role <> 'admin';
