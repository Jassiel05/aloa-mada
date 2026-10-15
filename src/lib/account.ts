import { createAdminClient } from "./supabase/admin";

/**
 * Suppression définitive d'un compte : photos et CV, puis utilisateur Supabase.
 * Le profil, les coordonnées, les messages, les offres et les candidatures
 * disparaissent avec lui (clés étrangères « on delete cascade »).
 */
export async function deleteAccount(userId: string): Promise<{ error?: string }> {
  const admin = createAdminClient();
  if (!admin) return { error: "La suppression automatique n'est pas encore activée. Écrivez-nous pour supprimer votre compte." };

  for (const bucket of ["avatars", "cvs"]) {
    const { data: files } = await admin.storage.from(bucket).list(userId, { limit: 100 });
    if (files?.length) await admin.storage.from(bucket).remove(files.map((f) => `${userId}/${f.name}`));
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  return error ? { error: "La suppression a échoué. Réessayez dans un instant." } : {};
}
