"use client";

import { useActionState } from "react";
import { requestUpgrade } from "@/app/actions/upgrade";

export default function UpgradeForm({ operators }: { operators: { operator: string; label: string }[] }) {
  const [state, action, pending] = useActionState(requestUpgrade, undefined);
  if (state?.info) return <p role="status" className="mt-6 rounded-xl bg-brand-soft p-4 font-semibold leading-relaxed text-brand-ink">{state.info}</p>;
  return (
    <form action={action} className="mt-6 grid gap-4 border-t border-line pt-6 sm:grid-cols-3">
      <div>
        <label htmlFor="operator" className="label">Opérateur</label>
        <select id="operator" name="operator" className="field">
          {operators.map((n) => <option key={n.operator} value={n.operator}>{n.label}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="months" className="label">Durée</label>
        <select id="months" name="months" className="field" defaultValue="1">
          {[1, 3, 6, 12].map((m) => <option key={m} value={m}>{m} mois</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="reference" className="label">Référence SMS</label>
        <input id="reference" name="reference" required minLength={3} maxLength={80} className="field" placeholder="ex. MP2410…" />
      </div>
      {state?.error && <p role="alert" className="text-sm font-semibold text-danger sm:col-span-3">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary min-h-12 sm:col-span-3">{pending ? "Envoi…" : "Envoyer ma demande d'activation"}</button>
    </form>
  );
}
