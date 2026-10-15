import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireOnboarded } from "@/lib/viewer";
import { displayName, publicPhoto } from "@/lib/labels";
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

  // Dernier message de chaque conversation, pour l'aperçu
  const { data: recent } = convs.length
    ? await supabase.from("messages").select("conversation_id, sender_id, body, created_at").in("conversation_id", convs.map((c) => c.id)).order("created_at", { ascending: false }).limit(Math.min(500, convs.length * 10))
    : { data: [] };
  const last = new Map<string, { sender_id: string; body: string }>();
  for (const m of (recent ?? []) as { conversation_id: string; sender_id: string; body: string }[]) if (!last.has(m.conversation_id)) last.set(m.conversation_id, m);

  const when = (d: string) => {
    const date = new Date(d);
    const today = new Date().toDateString() === date.toDateString();
    return today ? date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  return (
    <main className="container-page max-w-3xl py-12">
      <h1 className="page-title">Messages</h1>
      {convs.length === 0 ? (
        <div className="card mt-8 p-8 leading-relaxed text-muted">
          {viewer.profile.role === "candidate" && !viewer.isPro
            ? "Aucun message pour l'instant. Les recruteurs vous écrivent ici dès que votre profil les intéresse."
            : <>Aucune conversation. <Link href="/">Parcourez la galerie</Link> pour contacter quelqu&apos;un.</>}
        </div>
      ) : (
        <ul className="card mt-8 divide-y divide-line overflow-hidden">
          {convs.map((c) => {
            const other = byId.get(c.user_a === viewer.id ? c.user_b : c.user_a);
            const n = unread.get(c.id) ?? 0;
            return (
              <li key={c.id}>
                <Link href={`/messages/${c.id}`} className="flex items-center gap-4 px-4 py-4 text-ink no-underline hover:bg-canvas hover:no-underline sm:px-5">
                  <span className="relative block aspect-[4/5] w-12 flex-none overflow-hidden rounded-lg">
                    <Portrait id={other?.id ?? c.id} src={other ? publicPhoto(other) : null} gender={other?.gender} alt="" sizes="48px" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="truncate font-bold">{other ? displayName(other.first_name, other.last_name) : "Membre"}</span>
                      <span className="flex-none text-xs text-muted">{when(c.last_message_at)}</span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-3">
                      <span className={`truncate text-sm ${n > 0 ? "font-semibold text-ink" : "text-muted"}`}>
                        {last.get(c.id) ? `${last.get(c.id)!.sender_id === viewer.id ? "Vous : " : ""}${last.get(c.id)!.body}` : "Nouvelle conversation"}
                      </span>
                      {n > 0 && <span className="ml-auto grid min-w-6 flex-none place-items-center rounded-full bg-brand px-1.5 py-0.5 text-xs font-bold text-white" aria-label={`${n} message${n > 1 ? "s" : ""} non lu${n > 1 ? "s" : ""}`}>{n}</span>}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
