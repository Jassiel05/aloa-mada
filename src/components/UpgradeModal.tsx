"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export type UpgradeKind = "contact" | "apply" | "offer";

const CONTENT: Record<UpgradeKind, { title: string; perks: string[] }> = {
  contact: {
    title: "Contactez en premier avec Candidat Pro",
    perks: ["Contactez directement les recruteurs", "Postulez aux offres en un clic", "Voyez les emails et téléphones des recruteurs"],
  },
  apply: {
    title: "Postulez en un clic avec Candidat Pro",
    perks: ["Postulez à toutes les offres, profil joint automatiquement", "Contactez directement les recruteurs", "Badge Pro et meilleure place dans la galerie"],
  },
  offer: {
    title: "Publiez vos offres avec Recruteur Pro",
    perks: ["Publiez des offres visibles par tous les talents", "Recevez les candidatures en un clic", "Badge Pro sur votre profil"],
  },
};

export default function UpgradeModal({ kind, onClose }: { kind: UpgradeKind | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (kind && !d.open) d.showModal();
    if (!kind && d.open) d.close();
  }, [kind]);

  const c = CONTENT[kind ?? "contact"];

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="upgrade-title"
      className="m-auto w-[min(440px,calc(100%-32px))] rounded-3xl bg-white p-0 backdrop:bg-ink/50"
    >
      <div className="flex flex-col gap-4 px-8 pt-9 pb-6 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-laterite-soft">
          <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C2410C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </div>
        <h2 id="upgrade-title" className="font-display text-[28px] leading-tight font-semibold">{c.title}</h2>
        <ul className="flex flex-col gap-2.5 text-left text-[15px]">
          {c.perks.map((p) => (
            <li key={p} className="flex gap-2.5">
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3F6B4E" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="mt-px flex-none">
                <path d="M5 12l5 5L20 7" />
              </svg>
              {p}
            </li>
          ))}
        </ul>
        <Link href="/pro" className="btn-primary mt-2 min-h-13 text-base">Passer en Pro</Link>
        <p className="text-[13px] text-muted">Paiement par MVola, Orange Money ou Airtel Money</p>
        <button type="button" onClick={onClose} className="btn-ghost">Plus tard</button>
      </div>
    </dialog>
  );
}
