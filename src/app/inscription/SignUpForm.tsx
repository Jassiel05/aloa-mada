"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signUp } from "@/app/actions/auth";

const ROLES = [
  { value: "candidate", title: "Je cherche du travail", text: "Je présente mon profil aux recruteurs." },
  { value: "recruiter", title: "Je recrute", text: "Entreprise ou particulier, je cherche quelqu'un." },
];

export default function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, undefined);
  const [role, setRole] = useState("candidate");

  if (state?.info) {
    return <p role="status" className="mt-8 rounded-2xl bg-ravinala-soft p-5 font-semibold text-ravinala-ink">{state.info}</p>;
  }

  return (
    <form action={action} className="mt-8 flex flex-col gap-5">
      <fieldset>
        <legend className="label">Vous êtes…</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {ROLES.map((r) => (
            <label
              key={r.value}
              className={`cursor-pointer rounded-2xl border p-4 transition-colors ${role === r.value ? "border-laterite bg-laterite-soft" : "border-field bg-white"}`}
            >
              <input
                type="radio"
                name="role"
                value={r.value}
                checked={role === r.value}
                onChange={() => setRole(r.value)}
                className="sr-only"
              />
              <span className="block font-bold">{r.title}</span>
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
        <label htmlFor="password" className="label">Mot de passe (8 caractères minimum)</label>
        <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="field" />
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="terms" required className="mt-1 size-4 accent-laterite" />
        <span>
          J&apos;accepte les <Link href="/cgu">CGU</Link> et la <Link href="/confidentialite">politique de confidentialité</Link>.
        </span>
      </label>
      {state?.error && <p role="alert" className="text-sm font-semibold text-laterite-dark">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary min-h-12 text-base">
        {pending ? "Création…" : "Continuer"}
      </button>
    </form>
  );
}
