"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/labels";

export async function startConversation(targetId: string, body: string): Promise<{ error?: string; upgrade?: boolean }> {
  const text = body.trim();
  if (!text) return { error: "Écrivez un message avant d'envoyer." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_conversation", { other: targetId, first_message: text });
  if (error) {
    return { error: friendlyError(error.message), upgrade: error.message.includes("upgrade_required") };
  }
  redirect(`/messages/${data}`);
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
