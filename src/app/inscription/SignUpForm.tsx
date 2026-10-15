"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signUp } from "@/app/actions/auth";

const ROLES = [
  { value: "candidate", title: "Je cherche du travail", text: "Emploi, mission ou extra : je présente mon profil aux recruteurs." },
  { value: "recruiter", title: "Je recrute", text: "Entreprise ou particulier, je cherche la bonne personne." },
];

export default function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, undefined);
  const [role, setRole] = useState("candidate");

  if (state?.info) {
    return <p role="status" className="mt-8 rounded-2xl bg-brand-soft p-5 font-semibold leading-relaxed text-brand-ink">{state.info}</p>;
  }

  return (
    <form action={action} className="mt-8 flex flex-col gap-5">
      <fieldset>
        <legend className="label mb-2">Vous êtes</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {ROLES.map((r) => (
            <label
              key={r.value}
              className={`relative cursor-pointer rounded-2xl border-2 p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand ${role === r.value ? "border-brand bg-brand-soft" : "border-line bg-white hover:border-field"}`}
            >
              <input
                type="radio"
                name="role"
                value={r.value}
                checked={role === r.value}
                onChange={() => setRole(r.value)}
                className="sr-only"
              />
              <span className="block pr-6 font-bold">{r.title}</span>
              <span aria-hidden="true" className={`absolute top-4 right-4 grid size-5 place-items-center rounded-full border-2 ${role === r.value ? "border-brand bg-brand" : "border-field bg-white"}`}>{role === r.value && <span className="size-2 rounded-full bg-white" />}</span>
              <span className="mt-1 block text-sm text-muted">{r.text}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="first_name" className="label">Prénom</label>
        <input id="first_name" name="first_name" required autoComplete="given-name" className="field" />
      </div>
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="field" />
      </div>
      <div>
        <label htmlFor="password" className="label">Mot de passe</label>
        <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" aria-describedby="password-hint" className="field" />
        <p id="password-hint" className="mt-1.5 text-[13px] text-muted">8 caractères minimum.</p>
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="terms" required className="mt-1 size-4 accent-brand" />
        <span>
          J&apos;accepte les <Link href="/cgu">CGU</Link> et la <Link href="/confidentialite">politique de confidentialité</Link>.
        </span>
      </label>
      {state?.error && <p role="alert" className="text-sm font-semibold text-danger">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary min-h-12 text-base">
        {pending ? "Création du compte…" : "Créer mon compte"}
      </button>
    </form>
  );
}
