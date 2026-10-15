import { SUPABASE_KEY, SUPABASE_URL } from "./supabase/env";

export type OAuthProvider = "google" | "apple";

/**
 * Fournisseurs activés dans Supabase › Authentication › Providers.
 * Un bouton n'apparaît que si le fournisseur est réellement activé.
 */
export async function enabledProviders(): Promise<OAuthProvider[]> {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: SUPABASE_KEY },
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const s = (await res.json()) as { external?: Record<string, boolean> };
    return (["google", "apple"] as const).filter((p) => s.external?.[p]);
  } catch {
    return [];
  }
}
