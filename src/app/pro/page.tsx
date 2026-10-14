import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";
import { PAYEE_NAME, PAYMENT_NUMBERS, PRICES, priceLabel } from "@/lib/pricing";
import UpgradeForm from "./UpgradeForm";

export const metadata: Metadata = { title: "Tarifs" };

const PLANS = [
  {
    title: "Candidat",
    simple: ["Profil dans la galerie", "Voir les offres", "Répondre aux recruteurs qui vous écrivent"],
    pro: ["Contacter les recruteurs en premier", "Postuler aux offres en un clic", "Voir emails et téléphones", "Badge Pro"],
    price: PRICES.candidate,
  },
  {
    title: "Recruteur",
    simple: ["Parcourir tous les talents", "Contacter les candidats", "Voir emails et téléphones"],
    pro: ["Publier des offres", "Recevoir les candidatures", "Badge Pro"],
    price: PRICES.recruiter,
  },
];

export default async function ProPage() {
  const viewer = await getViewer();
  let pendingRequest = false;
  if (viewer) {
    const supabase = await createClient();
    const { count } = await supabase.from("upgrade_requests").select("id", { count: "exact", head: true }).eq("user_id", viewer.id).eq("status", "pending");
    pendingRequest = (count ?? 0) > 0;
  }

  return (
    <main className="container-page py-12">
      <h1 className="font-display text-5xl font-normal tracking-tight">Simple ou Pro</h1>
      <p className="mt-3 max-w-xl text-lg text-muted">L&apos;inscription est gratuite. Le Pro débloque le premier contact, les candidatures et la publication d&apos;offres.</p>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {PLANS.map((p) => (
          <section key={p.title} className="card p-7">
            <h2 className="font-display text-3xl font-semibold">{p.title}</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="font-bold">Simple · gratuit</p>
                <ul className="mt-3 flex flex-col gap-2 text-sm text-muted">{p.simple.map((x) => <li key={x}>· {x}</li>)}</ul>
              </div>
              <div className="rounded-2xl bg-laterite-soft p-4">
                <p className="font-bold text-laterite-dark">Pro · {priceLabel(p.price)} Ar / mois</p>
                <ul className="mt-3 flex flex-col gap-2 text-sm">{[...p.simple, ...p.pro].map((x) => <li key={x}>✓ {x}</li>)}</ul>
              </div>
            </div>
          </section>
        ))}
      </div>

      <section className="mt-12 max-w-2xl">
        <h2 className="font-display text-3xl font-semibold">Passer en Pro</h2>
        {!viewer ? (
          <p className="mt-4"><Link href="/inscription" className="btn-primary">Créer mon profil d&apos;abord</Link></p>
        ) : viewer.isPro && !viewer.isAdmin ? (
          <p className="mt-4 rounded-xl bg-ravinala-soft p-4 font-semibold text-ravinala-ink">
            Vous êtes Pro{viewer.profile.plan_expires_at ? ` jusqu'au ${new Date(viewer.profile.plan_expires_at).toLocaleDateString("fr-FR")}` : ""}. Vous pouvez prolonger ci-dessous.
          </p>
        ) : null}
        {viewer && (
          <>
            <ol className="mt-6 flex list-decimal flex-col gap-2 pl-5">
              <li>Envoyez le montant ({priceLabel(viewer.profile.role === "recruiter" ? PRICES.recruiter : PRICES.candidate)} Ar par mois) à {PAYEE_NAME} :</li>
            </ol>
            <ul className="mt-3 grid gap-2 sm:grid-cols-3">
              {PAYMENT_NUMBERS.map((n) => (
                <li key={n.operator} className="card p-4"><p className="text-sm text-muted">{n.label}</p><p className="font-bold">{n.number}</p></li>
              ))}
            </ul>
            <ol start={2} className="mt-4 flex list-decimal flex-col gap-2 pl-5">
              <li>Recopiez la référence de transaction reçue par SMS dans le formulaire.</li>
              <li>Nous activons votre compte Pro après vérification.</li>
            </ol>
            {pendingRequest ? (
              <p className="mt-6 rounded-xl bg-sand p-4 font-semibold">Votre demande est en cours de vérification.</p>
            ) : (
              <UpgradeForm />
            )}
          </>
        )}
      </section>
    </main>
  );
}
