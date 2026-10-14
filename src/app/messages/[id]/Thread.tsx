"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/app/actions/contact";

export type Msg = { id: number; sender_id: string; body: string; created_at: string };

export default function Thread({ conversationId, me, initial }: { conversationId: string; me: string; initial: Msg[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`conv-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const m = payload.new as Msg;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, conversationId]);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setSending(true);
    setError(null);
    const res = await sendMessage(conversationId, body);
    setSending(false);
    if (!("message" in res) || !res.message) return setError(res.error ?? "Message non envoyé. Réessayez.");
    const m = res.message;
    setText("");
    setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
  }

  return (
    <div className="mt-6 flex flex-col">
      <ol className="flex flex-col gap-3" aria-live="polite">
        {messages.map((m) => {
          const mine = m.sender_id === me;
          return (
            <li key={m.id} className={`max-w-[85%] rounded-2xl px-4 py-3 ${mine ? "self-end bg-ink text-white" : "self-start border border-line bg-white"}`}>
              <p className="whitespace-pre-line">{m.body}</p>
              <p className={`mt-1 text-[11px] ${mine ? "text-white/70" : "text-muted"}`}>
                {new Date(m.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
              </p>
            </li>
          );
        })}
      </ol>
      <div ref={end} />
      <form onSubmit={send} className="sticky bottom-0 mt-6 flex gap-2 border-t border-line bg-ivory py-4">
        <label htmlFor="reply" className="sr-only">Votre réponse</label>
        <textarea
          id="reply"
          rows={2}
          maxLength={4000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              (e.currentTarget.form as HTMLFormElement).requestSubmit();
            }
          }}
          placeholder="Écrire un message…"
          className="field flex-1 py-3"
        />
        <button type="submit" disabled={sending || !text.trim()} className="btn-primary self-end">Envoyer</button>
      </form>
      {error && <p role="alert" className="text-sm font-semibold text-laterite-dark">{error}</p>}
    </div>
  );
}
