"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteAccount } from "@/lib/account";

export async function deleteMyAccount(_prev: { error?: string } | undefined, formData: FormData) {
  if (String(formData.get("confirm") ?? "").trim().toUpperCase() !== "SUPPRIMER") {
    return { error: "Tapez SUPPRIMER pour confirmer." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée. Reconnectez-vous." };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role === "admin") return { error: "Un compte administrateur ne peut pas se supprimer lui-même." };

  const res = await deleteAccount(user.id);
  if (res.error) return res;
  await supabase.auth.signOut();
  redirect("/?compte=supprime");
}
