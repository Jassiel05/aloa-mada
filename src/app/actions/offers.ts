"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "./auth";

export async function createOffer(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée." };

  const unit = String(formData.get("rate_unit") ?? "negotiable");
  const amount = formData.get("rate_amount") ? Number(formData.get("rate_amount")) : null;
  const { data, error } = await supabase
    .from("offers")
    .insert({
      recruiter_id: user.id,
      title: String(formData.get("title") ?? "").trim(),
      job_title: String(formData.get("job_title") ?? "").trim() || null,
      contract_type: String(formData.get("contract_type") ?? "cdi"),
      rate_amount: unit === "negotiable" ? null : amount,
      rate_currency: formData.get("rate_currency") === "EUR" ? "EUR" : "MGA",
      rate_unit: unit,
      city: String(formData.get("city") ?? "") || null,
      work_mode: String(formData.get("work_mode") ?? "") || null,
      start_date: String(formData.get("start_date") ?? "") || null,
      description: String(formData.get("description") ?? "").trim(),
    })
    .select("id")
    .single();

  if (error) {
    return {
      error: error.message.includes("row-level security")
        ? "La publication d'offres est réservée aux recruteurs Pro dont le profil est validé."
        : error.message,
    };
  }
  revalidatePath("/offres");
  redirect(`/offres/${data.id}`);
}

export async function applyToOffer(offerId: string, message: string): Promise<{ error?: string; upgrade?: boolean; ok?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Connectez-vous pour postuler." };
  const { error } = await supabase.from("applications").insert({ offer_id: offerId, candidate_id: user.id, message: message.trim() || null });
  if (error) {
    if (error.code === "23505") return { error: "Vous avez déjà postulé à cette offre." };
    if (error.message.includes("row-level security")) return { upgrade: true };
    return { error: error.message };
  }
  revalidatePath(`/offres/${offerId}`);
  return { ok: true };
}

export async function closeOffer(offerId: string) {
  const supabase = await createClient();
  await supabase.from("offers").update({ status: "closed" }).eq("id", offerId);
  revalidatePath("/mes-offres");
  revalidatePath("/offres");
}

export async function setApplicationStatus(applicationId: string, status: "seen" | "shortlisted" | "rejected") {
  const supabase = await createClient();
  await supabase.from("applications").update({ status }).eq("id", applicationId);
  revalidatePath("/mes-offres");
}
