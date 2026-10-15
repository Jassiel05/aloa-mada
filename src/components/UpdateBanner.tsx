"use client";

import { useEffect, useState } from "react";

const BUILD = process.env.NEXT_PUBLIC_BUILD_ID ?? "local";
const EVERY = 5 * 60 * 1000;

/** Propose « Mettre à jour » quand une nouvelle version a été déployée. Rien n'est appliqué sans clic. */
export default function UpdateBanner() {
  const [available, setAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (BUILD === "local") return;
    let stop = false;
    async function check() {
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        const { version } = (await res.json()) as { version: string };
        if (!stop && version && version !== "local" && version !== BUILD) setAvailable(true);
      } catch {
        // hors connexion : on réessaiera plus tard
      }
    }
    const timer = setInterval(check, EVERY);
    const onVisible = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVisible);
    check();
    return () => {
      stop = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (!available || dismissed) return null;
  return (
    <div role="status" className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-xl flex-wrap items-center justify-between gap-3 rounded-2xl bg-night px-5 py-4 text-white shadow-lift">
      <p className="text-sm font-semibold">Une nouvelle version d&apos;Aloa-Mada est disponible.</p>
      <div className="flex gap-2">
        <button type="button" onClick={() => setDismissed(true)} className="btn min-h-10 text-white/80 underline">Plus tard</button>
        <button type="button" onClick={() => window.location.reload()} className="btn min-h-10 bg-brand text-white hover:bg-brand-dark">Mettre à jour</button>
      </div>
    </div>
  );
}
