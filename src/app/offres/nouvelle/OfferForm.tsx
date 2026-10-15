"use client";

import { useActionState } from "react";
import { createOffer } from "@/app/actions/offers";
import { CITIES, CONTRACTS, RATE_UNITS, WORK_MODES } from "@/lib/labels";

export default function OfferForm() {
  const [state, action, pending] = useActionState(createOffer, undefined);
  return (
    <form action={action} className="mt-8 flex flex-col gap-5">
      <div>
        <label htmlFor="title" className="label">Titre de l&apos;offre *</label>
        <input id="title" name="title" required minLength={3} maxLength={120} className="field" placeholder="ex. Électricien pour chantier de 2 semaines" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="job_title" className="label">Métier</label>
          <input id="job_title" name="job_title" className="field" />
        </div>
        <div>
          <label htmlFor="contract_type" className="label">Type de contrat *</label>
          <select id="contract_type" name="contract_type" className="field" required>
            {CONTRACTS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="city" className="label">Ville</label>
          <select id="city" name="city" className="field">
            <option value="">—</option>
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="work_mode" className="label">Mode de travail</label>
          <select id="work_mode" name="work_mode" className="field">
            <option value="">—</option>
            {WORK_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>
      <fieldset>
        <legend className="label">Rémunération</legend>
        <div className="grid gap-3 sm:grid-cols-[1fr_120px_180px]">
          <label htmlFor="rate_amount" className="sr-only">Montant</label>
          <input id="rate_amount" name="rate_amount" type="number" min={0} step={1000} className="field" placeholder="Montant" />
          <label htmlFor="rate_currency" className="sr-only">Devise</label>
          <select id="rate_currency" name="rate_currency" className="field"><option value="MGA">Ariary</option><option value="EUR">Euro</option></select>
          <label htmlFor="rate_unit" className="sr-only">Unité</label>
          <select id="rate_unit" name="rate_unit" className="field" defaultValue="month">
            {RATE_UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
          </select>
        </div>
      </fieldset>
      <div className="max-w-xs">
        <label htmlFor="start_date" className="label">Date de début</label>
        <input id="start_date" name="start_date" type="date" className="field" />
      </div>
      <div>
        <label htmlFor="description" className="label">Description *</label>
        <textarea id="description" name="description" required rows={7} maxLength={3000} className="field py-3" placeholder="Missions, horaires, profil recherché…" />
      </div>
      <p className="text-sm text-muted">L&apos;offre reste en ligne 30 jours.</p>
      {state?.error && <p role="alert" className="text-sm font-semibold text-danger">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary min-h-12 self-start px-8 text-base">{pending ? "Publication…" : "Publier l'offre"}</button>
    </form>
  );
}
