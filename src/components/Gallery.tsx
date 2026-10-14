"use client";

import { useState } from "react";
import type { Card } from "@/lib/cards";
import Portrait from "./Portrait";
import ProfileDrawer from "./ProfileDrawer";

export type GalleryViewer = { id: string; canStart: boolean } | null;

export default function Gallery({ cards, initialId, viewer }: { cards: Card[]; initialId: string | null; viewer: GalleryViewer }) {
  const [openId, setOpenId] = useState<string | null>(initialId);
  const selected = cards.find((c) => c.id === openId) ?? null;

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4 xl:grid-cols-5">
        {cards.map((c, i) => (
          <li key={c.id} className={i % 2 === 1 ? "mt-4" : ""}>
            <button
              type="button"
              onClick={() => setOpenId(c.id)}
              aria-label={`Voir la fiche de ${c.name}, ${c.title}${c.city ? ", " + c.city : ""}`}
              className={`group relative block aspect-[4/5] w-full overflow-hidden rounded-2xl text-left ${c.available ? "" : "opacity-70"}`}
            >
              <Portrait id={c.id} src={c.photo} alt="" priority={i < 5} grayscale={!c.available} />
              <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-ink">
                <span aria-hidden="true" className={`size-2 rounded-full ${c.available ? "bg-ravinala" : "bg-employed"}`} />
                <span className="hidden sm:inline">{c.availability}</span>
              </span>
              {c.isPro && (
                <span className="absolute top-3 left-3 rounded-full bg-laterite px-2.5 py-1 text-[11px] font-bold tracking-wider text-white">PRO</span>
              )}
              <span className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 bg-gradient-to-b from-transparent to-ink/85 px-3 pt-12 pb-3 text-white sm:px-4 sm:pb-4">
                <span className="font-display text-base font-semibold sm:text-xl">{c.name}</span>
                <span className="text-xs font-semibold sm:text-sm">{c.title}</span>
                <span className="hidden text-[13px] opacity-90 sm:block">
                  {c.city}
                  {c.rate ? ` · ${c.rate}` : ""}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <ProfileDrawer card={selected} viewer={viewer} onClose={() => setOpenId(null)} />
    </>
  );
}
