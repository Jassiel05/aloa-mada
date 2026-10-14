"use client";

import { useState, useTransition } from "react";
import { toggleFavorite } from "@/app/actions/favorites";

export default function FavoriteButton({
  profileId,
  offerId,
  initial,
  variant = "icon",
}: {
  profileId?: string;
  offerId?: string;
  initial: boolean;
  variant?: "icon" | "text";
}) {
  const [saved, setSaved] = useState(initial);
  const [pending, start] = useTransition();

  function onClick() {
    setSaved(!saved);
    start(async () => {
      const res = await toggleFavorite({ profileId, offerId });
      if (res.saved !== undefined) setSaved(res.saved);
      else setSaved(saved);
    });
  }

  const heart = (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill={saved ? "#C2410C" : "none"} stroke={saved ? "#C2410C" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );

  if (variant === "text") {
    return (
      <button type="button" onClick={onClick} disabled={pending} aria-pressed={saved} className="btn-outline">
        {heart}
        {saved ? "Sauvegardée" : "Sauvegarder"}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? "Retirer des favoris" : "Ajouter aux favoris"}
      className="grid size-11 place-items-center rounded-full bg-white text-ink"
    >
      {heart}
    </button>
  );
}
