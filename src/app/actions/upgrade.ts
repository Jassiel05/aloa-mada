"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/pricing";
import type { FormState } from "./auth";

export async function requestUpgrade(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Connectez-vous d'abord." };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const months = Math.min(12, Math.max(1, Number(formData.get("months") ?? 1)));
  const settings = await getSettings();
  const unit = profile?.role === "recruiter" ? settings.recruiter_price : settings.candidate_price;
  const reference = String(formData.get("reference") ?? "").trim();
  if (reference.length < 3) return { error: "Indiquez la référence de la transaction reçue par SMS." };

  const { error } = await supabase.from("upgrade_requests").insert({
    user_id: user.id,
    months,
    operator: ["mvola", "orange", "airtel"].includes(String(formData.get("operator"))) ? String(formData.get("operator")) : "mvola",
    reference,
    amount: unit != null ? unit * months : null,
  });
  if (error) return { error: error.message };
  revalidatePath("/pro");
  return { info: "Demande reçue ! Nous vérifions le paiement et activons votre compte Pro, en général sous quelques heures." };
}
