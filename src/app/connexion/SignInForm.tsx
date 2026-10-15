"use client";

import { useActionState } from "react";
import { signIn } from "@/app/actions/auth";

export default function SignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signIn, undefined);
  return (
    <form action={action} className="mt-6 flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="field" />
      </div>
      <div>
        <label htmlFor="password" className="label">Mot de passe</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="field" />
      </div>
      {state?.error && <p role="alert" className="text-sm font-semibold text-danger">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary min-h-12 text-base">
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
