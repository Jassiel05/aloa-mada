"use client";

import { useActionState } from "react";
import { saveSettings } from "@/app/actions/admin";
import type { AppSettings } from "@/lib/pricing";

export default function SettingsForm({ initial }: { initial: AppSettings }) {
  const [state, action, pending] = useActionState(saveSettings, undefined);
  return (
    <form action={action} className="card grid max-w-3xl gap-6 p-6">
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 font-display text-2xl font-semibold">Prix du Pro (Ariary par mois)</legend>
        <div>
          <label htmlFor="candidate_price" className="label">Candidat Pro</label>
          <input id="candidate_price" name="candidate_price" inputMode="numeric" defaultValue={initial.candidate_price ?? ""} placeholder="ex. 10000" className="field" />
        </div>
        <div>
          <label htmlFor="recruiter_price" className="label">Recruteur Pro</label>
          <input id="recruiter_price" name="recruiter_price" inputMode="numeric" defaultValue={initial.recruiter_price ?? ""} placeholder="ex. 25000" className="field" />
        </div>
        <p className="text-sm text-muted sm:col-span-2">Vide = « Prix bientôt disponible » sur la page Tarifs, et le formulaire de paiement reste fermé.</p>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 font-display text-2xl font-semibold">Réception des paiements</legend>
        <div className="sm:col-span-2">
          <label htmlFor="payee_name" className="label">Nom du bénéficiaire affiché</label>
          <input id="payee_name" name="payee_name" defaultValue={initial.payee_name ?? ""} placeholder="ex. Aloa-Mada" className="field" />
        </div>
        <div>
          <label htmlFor="mvola_number" className="label">Numéro MVola</label>
          <input id="mvola_number" name="mvola_number" type="tel" defaultValue={initial.mvola_number ?? ""} className="field" />
        </div>
        <div>
          <label htmlFor="orange_number" className="label">Numéro Orange Money</label>
          <input id="orange_number" name="orange_number" type="tel" defaultValue={initial.orange_number ?? ""} className="field" />
        </div>
        <div>
          <label htmlFor="airtel_number" className="label">Numéro Airtel Money</label>
          <input id="airtel_number" name="airtel_number" type="tel" defaultValue={initial.airtel_number ?? ""} className="field" />
        </div>
        <p className="self-end text-sm text-muted">Un opérateur sans numéro n&apos;est pas proposé aux membres.</p>
      </fieldset>

      {state?.error && <p role="alert" className="text-sm font-semibold text-laterite-dark">{state.error}</p>}
      {state?.info && <p role="status" className="text-sm font-semibold text-ravinala-ink">{state.info}</p>}
      <button type="submit" disabled={pending} className="btn-primary min-h-12 justify-self-start px-8">{pending ? "Enregistrement…" : "Enregistrer"}</button>
    </form>
  );
}
