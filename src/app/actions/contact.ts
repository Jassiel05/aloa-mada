"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/labels";
import { notifyNewMessage } from "@/lib/notify";

export async function startConversation(targetId: string, body: string): Promise<{ error?: string; upgrade?: boolean }> {
  const text = body.trim();
  if (!text) return { error: "Écrivez un message avant d'envoyer." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Connectez-vous d'abord." };
  const { data, error } = await supabase.rpc("start_conversation", { other: targetId, first_message: text });
  if (error) {
    return { error: friendlyError(error.message), upgrade: error.message.includes("upgrade_required") };
  }
  await notifyNewMessage(data as string, user.id, text);
  redirect(`/messages/${data}`);
}

/** Réponse dans une conversation existante (autorisée pour tous les participants, même en compte Simple). */
export async function sendMessage(conversationId: string, body: string) {
  const text = body.trim();
  if (!text) return { error: "Message vide." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée, reconnectez-vous." };
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: user.id, body: text })
    .select("id, sender_id, body, created_at")
    .single();
  if (error) return { error: "Message non envoyé. Réessayez." };
  await notifyNewMessage(conversationId, user.id, text);
  return { message: data as { id: number; sender_id: string; body: string; created_at: string } };
}

export async function reportContent(input: { profileId?: string; offerId?: string; reason: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Connectez-vous pour signaler." };
  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_profile_id: input.profileId ?? null,
    target_offer_id: input.offerId ?? null,
    reason: input.reason.trim(),
  });
  return error ? { error: error.message } : { ok: true };
}

/** Compte une vue de fiche (une par visiteur et par jour, géré en base). */
export async function recordView(profileId: string) {
  const supabase = await createClient();
  await supabase.rpc("record_view", { target: profileId });
}
