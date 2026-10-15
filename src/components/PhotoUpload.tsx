"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { photoUrl } from "@/lib/labels";
import { compressPortrait } from "@/lib/compress";

export default function PhotoUpload({ userId, value, onChange }: { userId: string; value: string | null; onChange: (path: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const url = photoUrl(value);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (file.type && !file.type.startsWith("image/")) return setError("Choisissez une image (JPG, PNG ou WebP).");
    setBusy(true);
    try {
      // Recadrée en 4:5 et compressée (moins de 120 Ko) avant l'envoi
      const blob = await compressPortrait(file);
      const ext = blob.type === "image/webp" ? "webp" : "jpg";
      const path = `${userId}/${Date.now()}.${ext}`;
      const supabase = createClient();
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { contentType: blob.type, upsert: false, cacheControl: "31536000" });
      if (upErr) throw upErr;
      if (value) await supabase.storage.from("avatars").remove([value]);
      onChange(path);
    } catch {
      setError("L'envoi a échoué. Réessayez avec une autre photo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="relative aspect-[4/5] w-full max-w-[180px] overflow-hidden rounded-2xl border-2 border-dashed border-field bg-subtle"
        aria-label={url ? "Changer la photo" : "Ajouter une photo portrait"}
      >
        {url ? (
          <Image src={url} alt="Votre photo portrait" fill sizes="180px" quality={70} className="object-cover" />
        ) : (
          <span className="absolute inset-0 grid place-items-center px-4 text-center text-sm font-semibold text-muted">
            {busy ? "Envoi…" : "+ Ajouter ma photo"}
          </span>
        )}
      </button>
      <div className="text-sm">
        <p className="font-bold">Une photo qui donne confiance</p>
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-muted">
          <li>Fond uni, lumière du jour, visage net</li>
          <li>Haut du corps, tenue de travail ou habillée</li>
          <li>Pas de lunettes de soleil, de groupe ni de filtre</li>
        </ul>
        <p className="mt-2 text-muted">Elle est recadrée automatiquement au format portrait et vérifiée avant publication.</p>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
        <button type="button" onClick={() => input.current?.click()} disabled={busy} className="btn-outline mt-3">
          {busy ? "Envoi…" : url ? "Changer la photo" : "Choisir une photo"}
        </button>
        {error && <p role="alert" className="mt-2 font-semibold text-danger">{error}</p>}
      </div>
    </div>
  );
}
