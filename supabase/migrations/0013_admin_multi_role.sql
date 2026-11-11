-- =====================================================================
-- Aloa-Mada — un administrateur peut aussi être candidat et/ou recruteur
-- Le rôle principal reste « admin » (tous les droits d'administration).
-- Deux options en plus, que seul un administrateur peut modifier :
--   admin_is_candidate : profil candidat visible dans la galerie, CV autorisé
--   admin_is_recruiter : profil recruteur visible, offres au nom de l'admin
-- Rien ne change pour les autres membres. Rejouable sans erreur.
-- =====================================================================

alter table public.profiles
  add column if not exists admin_is_candidate boolean not null default false,
  add column if not exists admin_is_recruiter boolean not null default false;

-- Même fonction qu'en 0001 : on ajoute seulement la protection des deux options
-- (un membre ne peut pas se les attribuer ; un admin, lui, passe avant le contrôle).
create or replace function public.guard_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then return new; end if;
  new.plan := old.plan;
  new.plan_expires_at := old.plan_expires_at;
  new.rejection_reason := old.rejection_reason;
  new.admin_is_candidate := old.admin_is_candidate;
  new.admin_is_recruiter := old.admin_is_recruiter;
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
