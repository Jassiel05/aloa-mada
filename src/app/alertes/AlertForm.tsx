"use client";

import { useActionState } from "react";
import { createAlert } from "@/app/actions/alerts";
import { CITIES, CONTRACTS } from "@/lib/labels";

export default function AlertForm({
  target,
  allowBoth,
  defaults,
}: {
  target: "talents" | "offers";
  allowBoth: boolean;
  defaults: { keyword: string; city: string; contract: string };
}) {
  const [state, action, pending] = useActionState(createAlert, undefined);
  return (
    <form action={action} className="card mt-8 grid gap-4 p-6 sm:grid-cols-2">
      {allowBoth ? (
        <div className="sm:col-span-2">
          <label htmlFor="target" className="label">Je veux être prévenu des nouveaux…</label>
          <select id="target" name="target" defaultValue={target} className="field">
            <option value="talents">Talents</option>
            <option value="offers">Offres</option>
          </select>
        </div>
      ) : (
        <input type="hidden" name="target" value={target} />
      )}
      <div className="sm:col-span-2">
        <label htmlFor="keyword" className="label">Métier ou mot-clé</label>
        <input id="keyword" name="keyword" maxLength={80} defaultValue={defaults.keyword} placeholder="ex. plombier, comptable, graphiste" className="field" />
      </div>
      <div>
        <label htmlFor="city" className="label">Ville</label>
        <select id="city" name="city" defaultValue={defaults.city} className="field">
          <option value="">Toutes</option>
          {CITIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="contract" className="label">Contrat</label>
        <select id="contract" name="contract" defaultValue={defaults.contract} className="field">
          <option value="">Tous</option>
          {CONTRACTS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      {state?.error && <p role="alert" className="text-sm font-semibold text-laterite-dark sm:col-span-2">{state.error}</p>}
      {state?.info && <p role="status" className="text-sm font-semibold text-ravinala-ink sm:col-span-2">{state.info}</p>}
      <button type="submit" disabled={pending} className="btn-primary min-h-12 sm:col-span-2">{pending ? "Création…" : "Créer l'alerte"}</button>
    </form>
  );
}
