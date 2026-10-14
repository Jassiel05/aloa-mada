"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyProActivated, notifyProfileStatus, runTalentAlerts } from "@/lib/notify";

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
