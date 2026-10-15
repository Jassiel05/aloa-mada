"use client";

import { useState, useTransition } from "react";
import { applyToOffer } from "@/app/actions/offers";
import UpgradeModal from "@/components/UpgradeModal";

export default function ApplyBox({ offerId, canApply, alreadyApplied, pendingProfile }: { offerId: string; canApply: boolean; alreadyApplied: boolean; pendingProfile: boolean }) {
  const [open, setOpen] = useState(false);
  const [upgrade, setUpgrade] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(alreadyApplied);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (done) {
    return <p role="status" className="rounded-2xl bg-brand-soft p-5 font-semibold text-brand-ink">Candidature envoyée. Le recruteur voit votre profil complet et peut vous écrire.</p>;
  }

  function onClick() {
    if (pendingProfile && canApply) return setError("Votre profil doit être validé avant de postuler.");
    if (!canApply) return setUpgrade(true);
    setOpen(true);
  }

  function send() {
    setError(null);
    start(async () => {
      const res = await applyToOffer(offerId, message);
      if (res.upgrade) setUpgrade(true);
      else if (res.error) setError(res.error);
      else setDone(true);
    });
  }

  return (
    <div className="card p-6">
      {open ? (
        <div className="flex flex-col gap-3">
          <label htmlFor="apply-msg" className="label">Un mot pour le recruteur (facultatif)</label>
          <textarea id="apply-msg" rows={3} maxLength={1500} value={message} onChange={(e) => setMessage(e.target.value)} className="field py-3" />
          <button type="button" onClick={send} disabled={pending} className="btn-primary min-h-12 text-base">{pending ? "Envoi…" : "Envoyer ma candidature"}</button>
        </div>
      ) : (
        <button type="button" onClick={onClick} className="btn-primary min-h-13 w-full text-base">Postuler</button>
      )}
      {error && <p role="alert" className="mt-3 text-sm font-semibold text-danger">{error}</p>}
      <UpgradeModal kind={upgrade ? "apply" : null} onClose={() => setUpgrade(false)} />
    </div>
  );
}
