"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Ajoute ou retire un profil / une offre des favoris. Renvoie le nouvel état. */
export async function toggleFavorite(target: { profileId?: string; offerId?: string }): Promise<{ saved?: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Connectez-vous pour sauvegarder." };

  const column = target.profileId ? "profile_id" : "offer_id";
  const value = target.profileId ?? target.offerId;
  if (!value) return { error: "Cible manquante." };

  const { data: existing } = await supabase.from("favorites").select("id").eq("user_id", user.id).eq(column, value).maybeSingle();
  if (existing) {
    await supabase.from("favorites").delete().eq("id", existing.id);
    revalidatePath("/favoris");
    return { saved: false };
  }
  const { error } = await supabase.from("favorites").insert({ user_id: user.id, [column]: value });
  if (error) return { error: error.message };
  revalidatePath("/favoris");
  return { saved: true };
}
