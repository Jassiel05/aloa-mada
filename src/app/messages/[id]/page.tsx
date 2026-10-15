import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOnboarded } from "@/lib/viewer";
import { displayName } from "@/lib/labels";
import type { Profile } from "@/lib/types";
import Thread, { type Msg } from "./Thread";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await requireOnboarded(`/messages/${id}`);
  const supabase = await createClient();

  const { data: conv } = await supabase.from("conversations").select("*").eq("id", id).maybeSingle();
  if (!conv) notFound();
  const otherId = conv.user_a === viewer.id ? conv.user_b : conv.user_a;
  const { data: other } = await supabase.from("profiles").select("*").eq("id", otherId).maybeSingle<Profile>();
  const { data: msgs } = await supabase.from("messages").select("id, sender_id, body, created_at").eq("conversation_id", id).order("created_at").limit(500);

  await supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("conversation_id", id).neq("sender_id", viewer.id).is("read_at", null);

  return (
    <main className="container-page flex max-w-3xl flex-col py-8">
      <Link href="/messages" className="text-sm font-bold">← Messages</Link>
      <h1 className="mt-4 font-display text-3xl font-bold">{other ? displayName(other.first_name, other.last_name) : "Conversation"}</h1>
      <Thread conversationId={id} me={viewer.id} initial={(msgs ?? []) as Msg[]} />
    </main>
  );
}
