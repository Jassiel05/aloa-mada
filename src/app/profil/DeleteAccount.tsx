"use client";

import { useActionState } from "react";
import { deleteMyAccount } from "@/app/actions/account";

export default function DeleteAccount() {
  const [state, action, pending] = useActionState(deleteMyAccount, undefined);
  return (
    <details className="group mt-14 rounded-2xl border border-line bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-bold [&::-webkit-details-marker]:hidden">
        Supprimer mon compte
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-open:rotate-180"><path d="M6 9l6 6 6-6" /></svg>
      </summary>
      <form action={action} className="flex flex-col gap-3 border-t border-line p-5">
        <p className="text-sm leading-relaxed text-muted">
          Votre profil, votre photo, vos messages, vos offres et vos candidatures seront effacés définitivement. Un abonnement Pro en cours n&apos;est pas remboursé.
        </p>
        <label htmlFor="confirm" className="label">Tapez SUPPRIMER pour confirmer</label>
        <input id="confirm" name="confirm" autoComplete="off" className="field max-w-xs" />
        {state?.error && <p role="alert" className="text-sm font-semibold text-danger">{state.error}</p>}
        <button type="submit" disabled={pending} className="btn self-start bg-danger text-white hover:bg-danger/90">
          {pending ? "Suppression…" : "Supprimer définitivement"}
        </button>
      </form>
    </details>
  );
}
