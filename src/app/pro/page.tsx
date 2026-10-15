import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";
import { getSettings, paymentNumbers, priceLabel } from "@/lib/pricing";
import UpgradeForm from "./UpgradeForm";

export const metadata: Metadata = {
  title: "Tarifs",
  description: "Inscription gratuite pour tous. Le compte Pro débloque le premier contact, les candidatures et la publication d'offres. Paiement par Mobile Money.",
  alternates: { canonical: "/pro" },
};

function Check({ muted = false }: { muted?: boolean }) {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={muted ? "#586660" : "#0e8a5f"} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-none">
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

export default async function ProPage() {
  const [viewer, settings] = await Promise.all([getViewer(), getSettings()]);
  const numbers = paymentNumbers(settings);

  const plans = [
    {
      key: "candidate",
      title: "Candidat",
      lead: "Pour trouver un emploi, une mission ou des extras.",
      simple: ["Votre profil avec photo dans la galerie", "Consultation de toutes les offres", "Réponse aux recruteurs qui vous écrivent"],
      pro: ["Contacter les recruteurs en premier", "Postuler aux offres en un clic", "Voir l'email et le téléphone des recruteurs", "Badge Pro, mis en avant dans la galerie"],
      price: settings.candidate_price,
    },
    {
      key: "recruiter",
      title: "Recruteur",
      lead: "Pour les entreprises, les commerces et les particuliers.",
      simple: ["Accès à tous les profils de talents", "Contact direct des candidats", "Email et téléphone des candidats"],
      pro: ["Publication d'offres d'emploi et de missions", "Réception des candidatures dans votre espace", "Alertes email sur les nouveaux profils", "Badge Pro sur votre fiche"],
      price: settings.recruiter_price,
    },
  ];

  let pendingRequest = false;
  if (viewer) {
    const supabase = await createClient();
    const { count } = await supabase.from("upgrade_requests").select("id", { count: "exact", head: true }).eq("user_id", viewer.id).eq("status", "pending");
    pendingRequest = (count ?? 0) > 0;
  }
  const myRole = viewer?.profile.role === "recruiter" ? "recruiter" : "candidate";
  const myPrice = myRole === "recruiter" ? settings.recruiter_price : settings.candidate_price;
  const ready = myPrice != null && numbers.length > 0;

  return (
    <main className="container-page py-12 sm:py-16">
      <div className="max-w-2xl">
        <h1 className="page-title">Tarifs simples, sans engagement</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          L&apos;inscription est gratuite pour tout le monde. Le compte Pro se paie au mois par Mobile Money et s&apos;arrête de lui-même à la fin de la période choisie.
        </p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {plans.map((p) => (
          <section key={p.key} aria-labelledby={`plan-${p.key}`} className="card overflow-hidden">
            <div className="p-7 sm:p-8">
              <h2 id={`plan-${p.key}`} className="section-title">{p.title}</h2>
              <p className="mt-1 text-muted">{p.lead}</p>
            </div>
            <div className="grid border-t border-line sm:grid-cols-2">
              <div className="p-7 sm:p-8">
                <p className="text-sm font-bold text-muted">Simple</p>
                <p className="mt-1 font-display text-3xl font-bold">Gratuit</p>
                <ul className="mt-5 flex flex-col gap-3 text-[15px]">
                  {p.simple.map((x) => <li key={x} className="flex gap-2.5"><Check muted />{x}</li>)}
                </ul>
              </div>
              <div className="border-t border-line bg-brand-soft/60 p-7 sm:border-t-0 sm:border-l sm:p-8">
                <p className="flex items-center gap-2 text-sm font-bold text-brand-ink">
                  Pro <span className="rounded-full bg-gold px-2 py-0.5 text-[11px] font-extrabold text-forest">Recommandé</span>
                </p>
                <p className="mt-1 font-display text-3xl font-bold">
                  {p.price != null ? <>{new Intl.NumberFormat("fr-FR").format(p.price)} Ar<span className="text-base font-semibold text-muted"> / mois</span></> : <span className="text-xl">Prix bientôt disponible</span>}
                </p>
                <p className="mt-5 text-sm font-semibold">Tout le compte Simple, plus :</p>
                <ul className="mt-3 flex flex-col gap-3 text-[15px]">
                  {p.pro.map((x) => <li key={x} className="flex gap-2.5"><Check />{x}</li>)}
                </ul>
              </div>
            </div>
          </section>
        ))}
      </div>

      <section id="payer" aria-labelledby="payer-title" className="mt-16 grid gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <h2 id="payer-title" className="section-title">Passer en Pro</h2>
          <p className="mt-3 max-w-md leading-relaxed text-muted">
            Le paiement se fait par Mobile Money. Votre compte Pro est activé dès que nous avons vérifié la transaction.
          </p>
        </div>

        <div>
          {!viewer ? (
            <div className="card p-7">
              <p className="font-semibold">Créez d&apos;abord votre profil gratuit, puis revenez ici pour passer en Pro.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/inscription" className="btn-primary">Créer mon profil</Link>
                <Link href="/connexion?next=/pro" className="btn-outline">Se connecter</Link>
              </div>
            </div>
          ) : (
            <>
              {viewer.isPro && !viewer.isAdmin && (
                <p className="mb-4 rounded-xl bg-brand-soft p-4 font-semibold text-brand-ink">
                  Votre compte est Pro{viewer.profile.plan_expires_at ? ` jusqu'au ${new Date(viewer.profile.plan_expires_at).toLocaleDateString("fr-FR")}` : ""}. Vous pouvez le prolonger ci-dessous.
                </p>
              )}
              {!ready ? (
                <p className="card p-6 font-semibold">Le paiement du compte Pro ouvre très prochainement. Revenez dans quelques jours.</p>
              ) : pendingRequest ? (
                <p className="card p-6 font-semibold">Votre paiement est en cours de vérification. Vous recevrez un email dès que votre compte Pro est activé.</p>
              ) : (
                <div className="card p-6 sm:p-8">
                  <ol className="flex flex-col gap-6">
                    <li className="flex gap-4">
                      <span className="grid size-8 flex-none place-items-center rounded-lg bg-forest text-sm font-bold text-white">1</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">
                          Envoyez {priceLabel(myPrice)} par mois souhaité{settings.payee_name ? <>, au nom de <strong>{settings.payee_name}</strong></> : ""}.
                        </p>
                        <ul className="mt-3 grid gap-2 sm:grid-cols-3">
                          {numbers.map((n) => (
                            <li key={n.operator} className="rounded-xl bg-subtle px-4 py-3">
                              <p className="text-xs font-semibold text-muted">{n.label}</p>
                              <p className="mt-0.5 font-bold tabular-nums">{n.number}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <span className="grid size-8 flex-none place-items-center rounded-lg bg-forest text-sm font-bold text-white">2</span>
                      <p className="font-semibold">Recopiez la référence de la transaction reçue par SMS dans le formulaire ci-dessous.</p>
                    </li>
                  </ol>
                  <UpgradeForm operators={numbers.map(({ operator, label }) => ({ operator, label }))} />
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
