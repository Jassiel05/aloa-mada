import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";
import { contractLabel, displayName, formatRate, workModeLabel } from "@/lib/labels";
import type { Offer, Profile } from "@/lib/types";
import ApplyBox from "./ApplyBox";
import FavoriteButton from "@/components/FavoriteButton";

export default async function OfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const viewer = await getViewer();
  const { data: offer } = await supabase.from("offers").select("*").eq("id", id).maybeSingle<Offer>();
  if (!offer) notFound();

  const { data: recruiter } = await supabase.from("profiles").select("*").eq("id", offer.recruiter_id).maybeSingle<Profile>();
  let alreadyApplied = false;
  if (viewer?.profile.role === "candidate") {
    const { count } = await supabase.from("applications").select("id", { count: "exact", head: true }).eq("offer_id", id).eq("candidate_id", viewer.id);
    alreadyApplied = (count ?? 0) > 0;
  }
  let saved = false;
  if (viewer) {
    const { count } = await supabase.from("favorites").select("id", { count: "exact", head: true }).eq("user_id", viewer.id).eq("offer_id", id);
    saved = (count ?? 0) > 0;
  }
  const expired = offer.status !== "open" || new Date(offer.expires_at) < new Date();

  const facts: [string, React.ReactNode][] = [
    ["Rémunération", formatRate(offer.rate_amount, offer.rate_currency, offer.rate_unit)],
    ["Contrat", contractLabel(offer.contract_type)],
    ...(offer.city ? ([["Lieu", offer.city]] as [string, string][]) : []),
    ...(offer.work_mode ? ([["Organisation", workModeLabel(offer.work_mode)]] as [string, string][]) : []),
    ...(offer.start_date ? ([["Début", new Date(offer.start_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })]] as [string, string][]) : []),
    ["Candidatures jusqu'au", new Date(offer.expires_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })],
  ];

  return (
    <main className="container-page py-10 sm:py-14">
      <Link href="/offres" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-ink">
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        Toutes les offres
      </Link>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px] lg:gap-12">
        <article>
          <p className="inline-flex rounded-md bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand-ink">{contractLabel(offer.contract_type)}</p>
          <h1 className="mt-3 page-title">{offer.title}</h1>
          {recruiter && (
            <p className="mt-3 text-muted">
              Publiée par{" "}
              <Link href={`/?vue=recruteurs&p=${recruiter.id}`} className="font-bold">{displayName(recruiter.first_name, recruiter.last_name)}</Link>
              {" "}le {new Date(offer.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
            </p>
          )}
          <div className="card mt-8 p-6 text-[17px] leading-relaxed whitespace-pre-line sm:p-8">{offer.description}</div>
        </article>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <dl className="card divide-y divide-line">
            {facts.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 px-5 py-3.5">
                <dt className="text-sm text-muted">{k}</dt>
                <dd className="text-right font-bold">{v}</dd>
              </div>
            ))}
          </dl>
          {expired ? (
            <p className="card p-5 font-semibold text-muted">Cette offre est clôturée : elle ne reçoit plus de candidatures.</p>
          ) : !viewer ? (
            <div className="card p-5">
              <p className="font-semibold">Connectez-vous pour postuler à cette offre.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/connexion?next=/offres/${offer.id}`} className="btn-primary">Se connecter</Link>
                <Link href="/inscription" className="btn-outline">Créer mon profil</Link>
              </div>
            </div>
          ) : viewer.profile.role === "candidate" ? (
            <ApplyBox offerId={offer.id} canApply={viewer.can.apply} alreadyApplied={alreadyApplied} pendingProfile={viewer.profile.status !== "approved"} />
          ) : null}
          {viewer && <FavoriteButton offerId={offer.id} initial={saved} variant="text" />}
        </aside>
      </div>
    </main>
  );
}
