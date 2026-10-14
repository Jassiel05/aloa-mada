/**
 * Adresse publique du site, sans configuration manuelle :
 * 1. NEXT_PUBLIC_SITE_URL si vous l'avez définie (ex. votre nom de domaine) ;
 * 2. sinon l'URL de production fournie automatiquement par Vercel ;
 * 3. sinon l'URL du déploiement Vercel en cours (aperçus) ;
 * 4. sinon http://localhost:3000 en local.
 */
export function siteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}
