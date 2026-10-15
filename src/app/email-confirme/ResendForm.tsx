"use client";

import { useActionState } from "react";
import { resendConfirmation } from "@/app/actions/auth";

export default function ResendForm() {
  const [state, action, pending] = useActionState(resendConfirmation, undefined);
  if (state?.info) {
    return <p role="status" className="mt-8 rounded-2xl bg-brand-soft p-5 font-semibold leading-relaxed text-brand-ink">{state.info}</p>;
  }
  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <div>
        <label htmlFor="email" className="label">Email utilisé à l&apos;inscription</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="field" />
      </div>
      {state?.error && <p role="alert" className="text-sm font-semibold text-danger">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary min-h-12 text-base">
        {pending ? "Envoi…" : "Recevoir un nouveau lien"}
      </button>
    </form>
  );
}
