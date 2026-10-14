import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

/**
 * Client « service role » : contourne les règles RLS.
 * À utiliser UNIQUEMENT côté serveur (actions, routes), jamais dans un composant client.
 * Sert aux notifications : retrouver l'email d'un destinataire, chercher les alertes correspondantes.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
