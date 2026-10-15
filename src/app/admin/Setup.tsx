import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSettings, paymentNumbers } from "@/lib/pricing";
import { enabledProviders } from "@/lib/oauth";
import { siteUrl } from "@/lib/site";

export type Check = {
  key: string;
  title: string;
  ok: boolean;
  optional?: boolean;
  done: string;
  todo: string;
  href?: string;
  action?: string;
};

/** État de chaque réglage nécessaire à l'ouverture du site. */
export async function setupChecks(): Promise<Check[]> {
  const supabase = await createClient();
  const [settings, providers, { error: dbError }] = await Promise.all([
    getSettings(),
    enabledProviders(),
    supabase.from("candidate_details").select("cv_path").limit(1),
  ]);
  const site = siteUrl();
  const hasSecret = createAdminClient() !== null;
  const hasEmail = !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;
  const numbers = paymentNumbers(settings);
  const sbAuth = "https://supabase.com/dashboard/project/jvjwcnugivibhrrsaiqs/auth/providers";

  return [
    {
      key: "db",
      title: "Base de données à jour",
      ok: !dbError,
      done: "Toutes les migrations sont appliquées.",
      todo: "Une migration récente manque (CV). Vérifiez l'intégration GitHub de Supabase, ou exécutez supabase/migrations/0007_cv_portfolio.sql dans le SQL Editor.",
      href: "https://supabase.com/dashboard/project/jvjwcnugivibhrrsaiqs/sql/new",
      action: "Ouvrir le SQL Editor",
    },
    {
      key: "secret",
      title: "Clé secrète Supabase sur Vercel",
      ok: hasSecret,
      done: "Emails automatiques et suppression de compte activés.",
      todo: "Sans elle, aucun email n'est envoyé et la suppression de compte reste manuelle. Supabase › Integrations › Vercel, puis Redeploy sur Vercel.",
      href: "https://supabase.com/dashboard/project/jvjwcnugivibhrrsaiqs/settings/integrations",
      action: "Relier Vercel",
    },
    {
      key: "email",
      title: "Envoi des emails (Resend)",
      ok: hasEmail,
      done: `Expéditeur : ${process.env.EMAIL_FROM ?? ""}`,
      todo: "Créez un compte Resend, vérifiez votre domaine, puis ajoutez RESEND_API_KEY et EMAIL_FROM dans Vercel › Settings › Environment Variables (puis Redeploy).",
      href: "https://resend.com/domains",
      action: "Ouvrir Resend",
    },
    {
      key: "prices",
      title: "Prix du compte Pro",
      ok: settings.candidate_price != null && settings.recruiter_price != null,
      done: `Candidat ${settings.candidate_price?.toLocaleString("fr-FR")} Ar, recruteur ${settings.recruiter_price?.toLocaleString("fr-FR")} Ar par mois.`,
      todo: "Tant qu'un prix manque, la page Tarifs affiche « Prix bientôt disponible » et le paiement reste fermé.",
      href: "/admin?tab=parametres",
      action: "Régler les prix",
    },
    {
      key: "mobile-money",
      title: "Numéros Mobile Money",
      ok: numbers.length > 0 && !!settings.payee_name,
      done: `${numbers.map((n) => n.label).join(", ")} au nom de ${settings.payee_name ?? ""}.`,
      todo: "Indiquez le nom du bénéficiaire et au moins un numéro (MVola, Orange Money ou Airtel Money).",
      href: "/admin?tab=parametres",
      action: "Ajouter les numéros",
    },
    {
      key: "legal",
      title: "Éditeur et contact du site",
      ok: !!settings.publisher_name && !!settings.contact_email,
      done: `${settings.publisher_name ?? ""} · ${settings.contact_email ?? ""}`,
      todo: "Nom de l'éditeur et email de contact : ils apparaissent dans le pied de page, les CGU et la politique de confidentialité.",
      href: "/admin?tab=parametres",
      action: "Compléter",
    },
    {
      key: "google",
      title: "Connexion avec Google",
      optional: true,
      ok: providers.includes("google"),
      done: "Le bouton « Continuer avec Google » est affiché.",
      todo: "Créez un identifiant OAuth dans Google Cloud, puis collez Client ID et Secret dans Supabase › Providers › Google.",
      href: sbAuth,
      action: "Ouvrir Supabase",
    },
    {
      key: "apple",
      title: "Connexion avec Apple",
      optional: true,
      ok: providers.includes("apple"),
      done: "Le bouton « Continuer avec Apple » est affiché.",
      todo: "Nécessite un compte Apple Developer (99 $ / an). Supabase › Providers › Apple.",
      href: sbAuth,
      action: "Ouvrir Supabase",
    },
    {
      key: "domain",
      title: "Nom de domaine",
      optional: true,
      ok: !site.includes(".vercel.app") && !site.includes("localhost"),
      done: `Le site répond sur ${site.replace(/^https?:\/\//, "")}.`,
      todo: "Ajoutez aloa-mada.site dans Vercel › Settings › Domains, puis Redeploy. Pensez à mettre à jour Supabase › URL Configuration.",
      href: "https://vercel.com/dashboard",
      action: "Ouvrir Vercel",
    },
  ];
}

function Mark({ ok, optional }: { ok: boolean; optional?: boolean }) {
  if (ok) {
    return (
      <span className="grid size-7 flex-none place-items-center rounded-full bg-available text-white" aria-label="Fait">
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
      </span>
    );
  }
  return (
    <span
      className={`grid size-7 flex-none place-items-center rounded-full border-2 text-xs font-extrabold ${optional ? "border-field text-muted" : "border-aloa-orange text-aloa-orange"}`}
      aria-label={optional ? "Facultatif" : "À faire"}
    >
      {optional ? "" : "!"}
    </span>
  );
}

export default function Setup({ checks }: { checks: Check[] }) {
  const required = checks.filter((c) => !c.optional);
  const doneCount = required.filter((c) => c.ok).length;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <section aria-labelledby="setup-title" className="card min-w-0 overflow-hidden">
        <div className="border-b border-line p-6 sm:p-8">
          <h2 id="setup-title" className="section-title">Mise en service</h2>
          <p className="mt-2 text-muted">
            {doneCount === required.length
              ? "Tout l'essentiel est réglé : le site est prêt à accueillir les membres."
              : `${doneCount} réglage${doneCount > 1 ? "s" : ""} essentiel${doneCount > 1 ? "s" : ""} sur ${required.length}. Cette page se met à jour toute seule.`}
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-subtle" role="progressbar" aria-valuemin={0} aria-valuemax={required.length} aria-valuenow={doneCount} aria-label="Avancement">
            <div className="brand-gradient h-full rounded-full" style={{ width: `${(doneCount / required.length) * 100}%` }} />
          </div>
        </div>
        <ul className="divide-y divide-line">
          {checks.map((c) => (
            <li key={c.key} className="grid grid-cols-[28px_1fr] gap-x-4 gap-y-3 p-5 sm:grid-cols-[28px_1fr_auto] sm:px-8">
              <Mark ok={c.ok} optional={c.optional} />
              <div className="min-w-0 flex-1">
                <p className="font-bold">
                  {c.title}
                  {c.optional && <span className="ml-2 text-xs font-semibold text-muted">facultatif</span>}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{c.ok ? c.done : c.todo}</p>
              </div>
              {!c.ok && c.href && (
                c.href.startsWith("/") ? (
                  <Link href={c.href} className="btn-outline col-start-2 min-h-10 self-start justify-self-start sm:col-start-3 sm:row-start-1">{c.action}</Link>
                ) : (
                  <a href={c.href} target="_blank" rel="noopener noreferrer" className="btn-outline col-start-2 min-h-10 self-start justify-self-start sm:col-start-3 sm:row-start-1">{c.action} ↗</a>
                )
              )}
            </li>
          ))}
        </ul>
      </section>

      <aside className="flex min-w-0 flex-col gap-4">
        <div className="card p-6">
          <h3 className="font-display text-lg font-bold">Le quotidien de l&apos;admin</h3>
          <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed">
            <li><Link href="/admin?tab=profils">Profils à valider</Link> : vérifiez que la photo est un vrai portrait, puis Valider ou Refuser avec un motif.</li>
            <li><Link href="/admin?tab=paiements">Paiements</Link> : comparez la référence avec le SMS reçu sur votre téléphone, puis Valider.</li>
            <li><Link href="/admin?tab=signalements">Signalements</Link> : ouvrez le profil ou l&apos;offre signalé, suspendez si besoin.</li>
          </ol>
        </div>
        <div className="card p-6">
          <h3 className="font-display text-lg font-bold">Ajouter un autre admin</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">La personne crée d&apos;abord son compte sur le site, puis dans le SQL Editor de Supabase :</p>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-night p-4 text-[12px] leading-relaxed text-white">{`update public.profiles
set role = 'admin',
    status = 'approved',
    onboarded = true
where id = (select id from auth.users
  where email = 'son-email@exemple.com');`}</pre>
        </div>
      </aside>
    </div>
  );
}
