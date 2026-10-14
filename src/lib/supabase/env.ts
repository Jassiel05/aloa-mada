/**
 * Adresse et clé PUBLIQUE du projet Supabase Aloa-Mada.
 *
 * Ces deux valeurs sont publiques par nature : elles sont envoyées à chaque navigateur
 * et la sécurité repose sur les règles RLS de la base. Elles sont donc écrites ici par défaut,
 * pour que le site fonctionne sur Vercel sans saisir de variable.
 * Si l'intégration Supabase ↔ Vercel ajoute ses propres variables, elles sont prioritaires.
 *
 * La clé « service_role » (secrète) n'est JAMAIS écrite dans le code : elle arrive
 * uniquement par l'intégration Supabase ↔ Vercel (variable SUPABASE_SERVICE_ROLE_KEY).
 */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jvjwcnugivibhrrsaiqs.supabase.co";

export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_wEjoUaa6yjPKt9SP4C3aSQ_HmiQA4kF";
