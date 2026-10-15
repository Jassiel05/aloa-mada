"use client";

import { useActionState } from "react";
import { saveSettings } from "@/app/actions/admin";
import type { AppSettings } from "@/lib/pricing";

export default function SettingsForm({ initial }: { initial: AppSettings }) {
  const [state, action, pending] = useActionState(saveSettings, undefined);
  return (
    <form action={action} className="card grid max-w-3xl gap-10 p-6 sm:p-8">
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 section-title">Prix du Pro (Ariary par mois)</legend>
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
        <legend className="mb-2 section-title">Réception des paiements</legend>
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

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 section-title">Éditeur et contact</legend>
        <p className="-mt-1 text-sm text-muted sm:col-span-2">Affichés en bas de chaque page, dans les CGU et dans la politique de confidentialité.</p>
        <div>
          <label htmlFor="publisher_name" className="label">Nom de l&apos;éditeur</label>
          <input id="publisher_name" name="publisher_name" defaultValue={initial.publisher_name ?? ""} placeholder="ex. Aloa-Mada SARLU" className="field" />
        </div>
        <div>
          <label htmlFor="publisher_ids" className="label">NIF / STAT / RCS</label>
          <input id="publisher_ids" name="publisher_ids" defaultValue={initial.publisher_ids ?? ""} placeholder="ex. NIF 1234567890 · STAT 12345 11 2026 0 00001" className="field" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="publisher_address" className="label">Adresse</label>
          <input id="publisher_address" name="publisher_address" defaultValue={initial.publisher_address ?? ""} placeholder="ex. Lot II J 45, Ivandry, Antananarivo 101" className="field" />
        </div>
        <div>
          <label htmlFor="contact_email" className="label">Email de contact</label>
          <input id="contact_email" name="contact_email" type="email" defaultValue={initial.contact_email ?? ""} className="field" />
        </div>
        <div>
          <label htmlFor="contact_phone" className="label">Téléphone de contact</label>
          <input id="contact_phone" name="contact_phone" type="tel" defaultValue={initial.contact_phone ?? ""} className="field" />
        </div>
      </fieldset>

      {state?.error && <p role="alert" className="text-sm font-semibold text-danger">{state.error}</p>}
      {state?.info && <p role="status" className="text-sm font-semibold text-brand-ink">{state.info}</p>}
      <button type="submit" disabled={pending} className="btn-primary min-h-12 justify-self-start px-8">{pending ? "Enregistrement…" : "Enregistrer"}</button>
    </form>
  );
}
