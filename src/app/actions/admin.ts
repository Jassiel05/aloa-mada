"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyProActivated, notifyProfileStatus, runTalentAlerts } from "@/lib/notify";
import { deleteAccount } from "@/lib/account";

async function adminClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("forbidden");
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (data?.role !== "admin") throw new Error("forbidden");
  return supabase;
}

export async function approveProfile(id: string) {
  const supabase = await adminClient();
  await supabase.from("profiles").update({ status: "approved", rejection_reason: null }).eq("id", id);
  await notifyProfileStatus(id, true);
  await runTalentAlerts(id);
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function rejectProfile(id: string, formData: FormData) {
  const supabase = await adminClient();
  const reason = String(formData.get("reason") ?? "").trim() || "Photo non conforme : fond uni, visage net, tenue correcte.";
  await supabase.from("profiles").update({ status: "rejected", rejection_reason: reason }).eq("id", id);
  await notifyProfileStatus(id, false, reason);
  revalidatePath("/admin");
}

export async function approveUpgrade(id: string) {
  const supabase = await adminClient();
  const { data: req } = await supabase.from("upgrade_requests").select("user_id").eq("id", id).single();
  const { error } = await supabase.rpc("approve_upgrade", { request: id });
  if (!error && req) await notifyProActivated(req.user_id);
  revalidatePath("/admin");
}

export async function rejectUpgrade(id: string) {
  const supabase = await adminClient();
  await supabase.from("upgrade_requests").update({ status: "rejected", reviewed_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin");
}

export async function closeReport(id: string) {
  const supabase = await adminClient();
  await supabase.from("reports").update({ status: "approved" }).eq("id", id);
  revalidatePath("/admin");
}

export async function suspendProfile(id: string) {
  const supabase = await adminClient();
  await supabase.from("profiles").update({ status: "rejected", rejection_reason: "Compte suspendu suite à un signalement." }).eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function setVerified(id: string, verified: boolean) {
  const supabase = await adminClient();
  await supabase.from("recruiter_details").update({ verified }).eq("profile_id", id);
  revalidatePath("/admin");
}

export async function setPlan(id: string, formData: FormData) {
  const supabase = await adminClient();
  const months = Number(formData.get("months") ?? 0);
  if (months <= 0) {
    await supabase.from("profiles").update({ plan: "simple", plan_expires_at: null }).eq("id", id);
  } else {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    await supabase.from("profiles").update({ plan: "pro", plan_expires_at: d.toISOString() }).eq("id", id);
  }
  revalidatePath("/admin");
}

/** Prix des abonnements et numéros Mobile Money (table app_settings). */
export async function saveSettings(_prev: { error?: string; info?: string } | undefined, formData: FormData) {
  const supabase = await adminClient();
  const price = (k: string) => {
    const v = String(formData.get(k) ?? "").replace(/\s/g, "");
    return v === "" ? null : Math.max(0, Math.round(Number(v)));
  };
  const text = (k: string) => String(formData.get(k) ?? "").trim() || null;
  const candidate = price("candidate_price");
  const recruiter = price("recruiter_price");
  if ((candidate != null && Number.isNaN(candidate)) || (recruiter != null && Number.isNaN(recruiter))) {
    return { error: "Les prix doivent être des nombres (en Ariary)." };
  }
  const { error } = await supabase
    .from("app_settings")
    .update({
      candidate_price: candidate,
      recruiter_price: recruiter,
      payee_name: text("payee_name"),
      mvola_number: text("mvola_number"),
      orange_number: text("orange_number"),
      airtel_number: text("airtel_number"),
      publisher_name: text("publisher_name"),
      publisher_address: text("publisher_address"),
      publisher_ids: text("publisher_ids"),
      contact_email: text("contact_email"),
      contact_phone: text("contact_phone"),
    })
    .eq("id", true);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { info: "Paramètres enregistrés. Le site est à jour." };
}

/** Suppression définitive d'un membre (demande de suppression, faux compte). */
export async function deleteMember(id: string, formData: FormData) {
  await adminClient();
  if (String(formData.get("confirm") ?? "") !== "oui") return;
  await deleteAccount(id);
  revalidatePath("/admin");
  revalidatePath("/");
}
