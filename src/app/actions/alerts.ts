"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "./auth";

export async function createAlert(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Connectez-vous d'abord." };

  const target = formData.get("target") === "offers" ? "offers" : "talents";
  const keyword = String(formData.get("keyword") ?? "").trim().slice(0, 80) || null;
  const city = String(formData.get("city") ?? "") || null;
  const contract = String(formData.get("contract") ?? "") || null;
  if (!keyword && !city && !contract) return { error: "Choisissez au moins un critère (métier, ville ou contrat)." };

  const { error } = await supabase.from("alerts").insert({ user_id: user.id, target, keyword, city, contract });
  if (error) return { error: error.message.includes("alert_limit") ? "Vous avez déjà 10 alertes : supprimez-en une." : error.message };
  revalidatePath("/alertes");
  return { info: "Alerte créée. Vous recevrez un email à chaque nouveauté correspondante." };
}

export async function deleteAlert(id: string) {
  const supabase = await createClient();
  await supabase.from("alerts").delete().eq("id", id);
  revalidatePath("/alertes");
}

export async function toggleAlert(id: string, active: boolean) {
  const supabase = await createClient();
  await supabase.from("alerts").update({ active }).eq("id", id);
  revalidatePath("/alertes");
}
