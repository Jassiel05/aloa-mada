"use client";

import { useState } from "react";
import type { Card } from "@/lib/cards";
import Portrait from "./Portrait";
import ProfileDrawer from "./ProfileDrawer";

export type GalleryViewer = { id: string; canStart: boolean; seeContacts: boolean; favorites: string[] } | null;

export default function Gallery({ cards, initialId, viewer }: { cards: Card[]; initialId: string | null; viewer: GalleryViewer }) {
  const [openId, setOpenId] = useState<string | null>(initialId);
  const selected = cards.find((c) => c.id === openId) ?? null;

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
        {cards.map((c, i) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => setOpenId(c.id)}
              aria-label={`Voir la fiche de ${c.name}, ${c.title}${c.city ? ", " + c.city : ""}`}
              className="group relative block aspect-[4/5] w-full overflow-hidden rounded-2xl bg-subtle text-left shadow-soft transition-shadow hover:shadow-lift"
            >
              <Portrait id={c.id} src={c.photo} alt="" priority={i < 5} grayscale={!c.available} />
              <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2 py-1 text-[11px] font-bold text-ink sm:top-3 sm:left-3 sm:px-2.5 sm:text-xs">
                <span aria-hidden="true" className={`size-2 rounded-full ${c.available ? "bg-available" : "bg-employed"}`} />
                <span className="max-sm:sr-only">{c.availability}</span>
              </span>
              {c.isPro && (
                <span className="absolute top-2.5 right-2.5 pro-badge px-2 py-1 text-[11px] sm:top-3 sm:right-3">Pro</span>
              )}
              <span className="absolute inset-x-0 bottom-0 flex flex-col bg-gradient-to-b from-transparent via-night/55 to-night/95 px-3 pt-16 pb-3 text-white sm:px-4 sm:pb-4">
                <span className="font-display text-[17px] leading-tight font-bold sm:text-xl">{c.name}</span>
                <span className="mt-0.5 truncate text-[13px] font-semibold text-white/90 sm:text-sm">{c.title}</span>
                {(c.city || c.rate) && (
                  <span className="mt-1 hidden truncate text-[13px] text-white/70 sm:block">
                    {[c.city, c.rate].filter(Boolean).join(" · ")}
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <ProfileDrawer card={selected} viewer={viewer} onClose={() => setOpenId(null)} />
    </>
  );
}
