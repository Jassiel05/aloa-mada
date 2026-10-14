import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireOnboarded } from "@/lib/viewer";
import { displayName, photoUrl } from "@/lib/labels";
import type { Profile } from "@/lib/types";
import Portrait from "@/components/Portrait";

export const metadata: Metadata = { title: "Messages" };

type Conv = { id: string; user_a: string; user_b: string; last_message_at: string };

export default async function MessagesPage() {
  const viewer = await requireOnboarded("/messages");
  const supabase = await createClient();
  const { data } = await supabase.from("conversations").select("id, user_a, user_b, last_message_at").or(`user_a.eq.${viewer.id},user_b.eq.${viewer.id}`).order("last_message_at", { ascending: false });
  const convs = (data ?? []) as Conv[];
  const otherIds = convs.map((c) => (c.user_a === viewer.id ? c.user_b : c.user_a));
  const { data: people } = otherIds.length ? await supabase.from("profiles").select("*").in("id", otherIds) : { data: [] };
  const byId = new Map(((people ?? []) as Profile[]).map((p) => [p.id, p]));

  const { data: unreadRows } = convs.length
    ? await supabase.from("messages").select("conversation_id").in("conversation_id", convs.map((c) => c.id)).neq("sender_id", viewer.id).is("read_at", null)
    : { data: [] };
  const unread = new Map<string, number>();
  for (const r of (unreadRows ?? []) as { conversation_id: string }[]) unread.set(r.conversation_id, (unread.get(r.conversation_id) ?? 0) + 1);

  return (
    <main className="container-page max-w-3xl py-12">
      <h1 className="font-display text-4xl font-semibold tracking-tight">Messages</h1>
      {convs.length === 0 ? (
        <div className="card mt-8 p-8 text-muted">
          {viewer.profile.role === "candidate" && !viewer.isPro
            ? "Aucun message pour l'instant. Les recruteurs vous écrivent ici dès que votre profil les intéresse."
            : <>Aucune conversation. <Link href="/">Parcourez la galerie</Link> pour contacter quelqu&apos;un.</>}
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {convs.map((c) => {
            const other = byId.get(c.user_a === viewer.id ? c.user_b : c.user_a);
            const n = unread.get(c.id) ?? 0;
            return (
              <li key={c.id}>
                <Link href={`/messages/${c.id}`} className="flex items-center gap-4 py-4 text-ink no-underline hover:bg-white">
                  <span className="relative block aspect-[4/5] w-12 flex-none overflow-hidden rounded-lg">
                    <Portrait id={other?.id ?? c.id} src={photoUrl(other?.photo_path ?? null)} alt="" sizes="48px" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-bold">{other ? displayName(other.first_name, other.last_name) : "Membre"}</span>
                    <span className="block text-sm text-muted">{new Date(c.last_message_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}</span>
                  </span>
                  {n > 0 && <span className="rounded-full bg-laterite px-2.5 py-1 text-xs font-bold text-white">{n} nouveau{n > 1 ? "x" : ""}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
