"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { photoUrl } from "@/lib/labels";

/** Recadre au centre en 4:5 (800×1000), compresse en JPEG puis envoie dans Supabase Storage. */
async function cropTo45(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const W = 800;
  const H = 1000;
  const ratio = W / H;
  let sw = bitmap.width;
  let sh = bitmap.height;
  if (sw / sh > ratio) sw = sh * ratio;
  else sh = sw / ratio;
  const sx = (bitmap.width - sw) / 2;
  const sy = Math.max(0, (bitmap.height - sh) / 3); // garde le visage, légèrement vers le haut
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  canvas.getContext("2d")!.drawImage(bitmap, sx, sy, sw, sh, 0, 0, W, H);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("conversion"))), "image/jpeg", 0.86),
  );
}

export default function PhotoUpload({ userId, value, onChange }: { userId: string; value: string | null; onChange: (path: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const url = photoUrl(value);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) return setError("Choisissez une image (JPG, PNG ou WebP).");
    setBusy(true);
    try {
      const blob = await cropTo45(file);
      const path = `${userId}/${Date.now()}.jpg`;
      const supabase = createClient();
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, blob, { contentType: "image/jpeg", upsert: false });
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
        className="relative aspect-[4/5] w-full max-w-[180px] overflow-hidden rounded-2xl border-2 border-dashed border-field bg-sand"
        aria-label={url ? "Changer la photo" : "Ajouter une photo portrait"}
      >
        {url ? (
          <Image src={url} alt="Votre photo portrait" fill sizes="180px" className="object-cover" />
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
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
        <button type="button" onClick={() => input.current?.click()} disabled={busy} className="btn-outline mt-3">
          {busy ? "Envoi…" : url ? "Changer la photo" : "Choisir une photo"}
        </button>
        {error && <p role="alert" className="mt-2 font-semibold text-laterite-dark">{error}</p>}
      </div>
    </div>
  );
}
