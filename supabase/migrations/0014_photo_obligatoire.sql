-- =====================================================================
-- Aloa-Mada — photo obligatoire et toujours affichée
--   1. Le choix « Ne pas afficher ma photo » disparaît : la photo est toujours visible.
--   2. Un profil ne peut pas être soumis (pending) ni validé (approved) sans photo.
-- Les administrateurs sont exemptés. Les profils déjà validés sans photo ne sont pas touchés
-- (le contrôle ne s'applique qu'au moment où le statut passe à pending / approved).
-- Rejouable sans erreur.
-- =====================================================================

update public.profiles set photo_hidden = false where photo_hidden;

create or replace function public.require_photo()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.role <> 'admin'
     and new.status in ('pending', 'approved')
     and (new.photo_path is null or btrim(new.photo_path) = '')
     and (tg_op = 'INSERT' or old.status is distinct from new.status)
  then
    raise exception 'La photo est obligatoire pour soumettre ou valider un profil.' using errcode = '23514';
  end if;
  return new;
end;
$$;

-- s'exécute après profiles_guard (ordre alphabétique) : on contrôle le statut final
drop trigger if exists profiles_require_photo on public.profiles;
create trigger profiles_require_photo before insert or update on public.profiles
for each row execute function public.require_photo();
