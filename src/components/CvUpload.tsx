"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CvError, formatSize, prepareCv } from "@/lib/compress";
import { removeCv, saveCv } from "@/app/actions/profile";

export type CvInfo = { size: number | null; updatedAt: string | null } | null;

function FileIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </svg>
  );
}

/** CV du candidat : PDF ou photo du CV, compressé automatiquement avant l'envoi. */
export default function CvUpload({ userId, initial }: { userId: string; initial: CvInfo }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [cv, setCv] = useState<CvInfo>(initial);
  const [step, setStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const busy = step !== null || pending;

  async function onFile(file: File | undefined) {
    if (input.current) input.current.value = "";
    if (!file) return;
    setError(null);
    setDone(null);
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf && !file.type.startsWith("image/")) return setError("Choisissez un PDF, ou une photo de votre CV (JPG, PNG).");
    if (file.size > 25 * 1024 * 1024) return setError("Ce fichier dépasse 25 Mo. Choisissez un fichier plus léger.");
    try {
      setStep("Compression…");
      const result = await prepareCv(file);
      setStep("Envoi…");
      const path = `${userId}/cv-${Date.now()}.pdf`;
      const { error: upErr } = await createClient()
        .storage.from("cvs")
        .upload(path, result.blob, { contentType: "application/pdf", upsert: false, cacheControl: "3600" });
      if (upErr) throw upErr;
      const res = await saveCv(path, result.after);
      if (res.error) throw new CvError(res.error);
      setCv({ size: result.after, updatedAt: new Date().toISOString() });
      setDone(
        result.after < result.before * 0.9
          ? `CV enregistré : ${formatSize(result.before)} → ${formatSize(result.after)}.`
          : `CV enregistré (${formatSize(result.after)}).`,
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof CvError ? e.message : "L'envoi a échoué. Vérifiez votre connexion et réessayez.");
    } finally {
      setStep(null);
    }
  }

  function onRemove() {
    setError(null);
    setDone(null);
    start(async () => {
      const res = await removeCv();
      if (res.error) return setError(res.error);
      setCv(null);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="flex flex-wrap items-center gap-4">
        <span className={`grid size-11 flex-none place-items-center rounded-xl ${cv ? "bg-brand-soft text-brand-ink" : "bg-subtle text-muted"}`}>
          <FileIcon />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold">{cv ? "Votre CV" : "CV (facultatif)"}</p>
          <p className="text-sm text-muted">
            {cv
              ? `PDF${cv.size ? ` · ${formatSize(cv.size)}` : ""}${cv.updatedAt ? ` · ajouté le ${new Date(cv.updatedAt).toLocaleDateString("fr-FR")}` : ""}`
              : "PDF ou photo du CV. Il est compressé automatiquement."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {cv && (
            <a href={`/cv/${userId}`} target="_blank" rel="noopener" className="btn-ghost min-h-10">Voir</a>
          )}
          <button type="button" onClick={() => input.current?.click()} disabled={busy} className="btn-outline min-h-10">
            {step ?? (cv ? "Remplacer" : "Ajouter mon CV")}
          </button>
          {cv && !step && (
            <button type="button" onClick={onRemove} disabled={busy} className="btn-ghost min-h-10 text-danger hover:text-danger">Retirer</button>
          )}
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept="application/pdf,.pdf,image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-label="Choisir un CV"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <p className="mt-3 text-[13px] text-muted">Visible uniquement par les recruteurs et les membres Pro, comme votre téléphone et votre email.</p>
      {done && <p role="status" className="mt-2 text-sm font-semibold text-brand-ink">{done}</p>}
      {error && <p role="alert" className="mt-2 text-sm font-semibold text-danger">{error}</p>}
    </div>
  );
}
