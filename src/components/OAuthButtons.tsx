import { signInWithProvider } from "@/app/actions/auth";
import type { OAuthProvider } from "@/lib/oauth";

const LABEL: Record<OAuthProvider, string> = { google: "Continuer avec Google", apple: "Continuer avec Apple" };

function Icon({ provider }: { provider: OAuthProvider }) {
  if (provider === "apple") {
    return (
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.37 12.62c-.02-2.3 1.88-3.4 1.97-3.46-1.07-1.57-2.74-1.78-3.33-1.8-1.42-.14-2.77.83-3.49.83-.72 0-1.830-.81-3.01-.79-1.55.02-2.98.9-3.78 2.29-1.610 2.8-.41 6.94 1.16 9.21.77 1.11 1.68 2.36 2.88 2.31 1.16-.05 1.6-.75 3-.75s1.79.75 3.02.72c1.25-.02 2.04-1.13 2.8-2.25.88-1.29 1.24-2.54 1.26-2.6-.03-.01-2.42-.93-2.45-3.68zM14.08 5.85c.64-.77 1.07-1.85.95-2.92-.92.04-2.03.61-2.69 1.38-.59.68-1.11 1.77-.97 2.82 1.03.08 2.07-.52 2.71-1.28z" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.29 14.29A7.2 7.2 0 0 1 4.91 12c0-.79.14-1.57.38-2.29v-3.1H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.39l4.01-3.1z" />
      <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.61l4.01 3.1C6.23 6.86 8.88 4.75 12 4.75z" />
    </svg>
  );
}

/**
 * Boutons « Continuer avec Google / Apple ». Rien n'est affiché tant qu'aucun
 * fournisseur n'est activé dans Supabase.
 */
export default function OAuthButtons({ providers, next = "/", role, separator = "après" }: { providers: OAuthProvider[]; next?: string; role?: string; separator?: "avant" | "après" }) {
  if (!providers.length) return null;
  const sep = (
    <div className="flex items-center gap-3 text-sm text-muted" aria-hidden="true">
      <span className="h-px flex-1 bg-line" />
      ou
      <span className="h-px flex-1 bg-line" />
    </div>
  );
  return (
    <div className="flex flex-col gap-5">
      {separator === "avant" && sep}
      <div className="flex flex-col gap-2.5">
        {providers.map((p) => (
          <form key={p} action={signInWithProvider}>
            <input type="hidden" name="provider" value={p} />
            <input type="hidden" name="next" value={next} />
            {role && <input type="hidden" name="role" value={role} />}
            <button
              type="submit"
              className={`btn min-h-12 w-full text-[15px] ${p === "apple" ? "bg-black text-white hover:bg-black/85" : "border border-field bg-white text-ink hover:border-ink"}`}
            >
              <Icon provider={p} />
              {LABEL[p]}
            </button>
          </form>
        ))}
      </div>
      {separator === "après" && sep}
    </div>
  );
}
