import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";
import { contractLabel, displayName, formatRate, workModeLabel } from "@/lib/labels";
import type { Offer, Profile } from "@/lib/types";
import ApplyBox from "./ApplyBox";

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
  const expired = offer.status !== "open" || new Date(offer.expires_at) < new Date();

  return (
    <main className="container-page max-w-3xl py-12">
      <Link href="/offres" className="text-sm font-bold">← Toutes les offres</Link>
      <p className="mt-8 text-xs font-bold tracking-wider text-ravinala uppercase">{contractLabel(offer.contract_type)}</p>
      <h1 className="mt-2 font-display text-5xl font-semibold tracking-tight">{offer.title}</h1>
      <dl className="mt-8 grid grid-cols-[140px_1fr] gap-x-4 gap-y-3 border-y border-line py-6">
        <dt className="text-muted">Rémunération</dt><dd className="font-bold">{formatRate(offer.rate_amount, offer.rate_currency, offer.rate_unit)}</dd>
        {offer.city && (<><dt className="text-muted">Lieu</dt><dd className="font-semibold">{offer.city}</dd></>)}
        {offer.work_mode && (<><dt className="text-muted">Mode</dt><dd className="font-semibold">{workModeLabel(offer.work_mode)}</dd></>)}
        {offer.start_date && (<><dt className="text-muted">Début</dt><dd className="font-semibold">{new Date(offer.start_date).toLocaleDateString("fr-FR")}</dd></>)}
        {recruiter && (<><dt className="text-muted">Publiée par</dt><dd className="font-semibold"><Link href={`/?vue=recruteurs&p=${recruiter.id}`}>{displayName(recruiter.first_name, recruiter.last_name)}</Link></dd></>)}
        <dt className="text-muted">Expire le</dt><dd className="font-semibold">{new Date(offer.expires_at).toLocaleDateString("fr-FR")}</dd>
      </dl>
      <div className="mt-8 text-[17px] leading-relaxed whitespace-pre-line">{offer.description}</div>

      <div className="mt-10">
        {expired ? (
          <p className="card p-6 font-semibold text-muted">Cette offre est clôturée.</p>
        ) : !viewer ? (
          <div className="card flex flex-wrap items-center justify-between gap-4 p-6">
            <p className="font-semibold">Créez votre profil pour postuler.</p>
            <Link href={`/connexion?next=/offres/${offer.id}`} className="btn-primary">Se connecter</Link>
          </div>
        ) : viewer.profile.role === "candidate" ? (
          <ApplyBox offerId={offer.id} canApply={viewer.can.apply} alreadyApplied={alreadyApplied} pendingProfile={viewer.profile.status !== "approved"} />
        ) : null}
      </div>
    </main>
  );
}
