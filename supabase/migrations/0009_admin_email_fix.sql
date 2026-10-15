-- =====================================================================
-- Aloa-Mada — adresse admin corrigée
-- L'admin est rakotoarinelinajassiel@gmail.com (et non responsable@bex-digital.com).
-- Rejouable sans erreur.
-- =====================================================================

delete from public.admin_emails where email = 'responsable@bex-digital.com';
insert into public.admin_emails (email) values ('rakotoarinelinajassiel@gmail.com') on conflict do nothing;

-- Retire le rôle admin éventuellement donné par erreur à l'ancienne adresse
update public.profiles p set role = 'candidate', onboarded = false
from auth.users u
where u.id = p.id and lower(u.email) = 'responsable@bex-digital.com' and p.role = 'admin';

-- Compte admin déjà créé et confirmé : promu tout de suite
update public.profiles p set role = 'admin', status = 'approved', onboarded = true
from auth.users u
where u.id = p.id and u.email_confirmed_at is not null
  and lower(u.email) in (select email from public.admin_emails)
  and p.role <> 'admin';
