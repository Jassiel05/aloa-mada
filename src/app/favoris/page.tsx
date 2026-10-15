import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireOnboarded } from "@/lib/viewer";
import { contractLabel, displayName, formatRate, photoUrl } from "@/lib/labels";
import type { Offer, Profile } from "@/lib/types";
import Portrait from "@/components/Portrait";
import FavoriteButton from "@/components/FavoriteButton";

export const metadata: Metadata = { title: "Mes favoris" };

type Row = {
  id: string;
  profile: (Profile & { candidate_details: { job_title: string | null } | null }) | null;
  offer: Offer | null;
};

export default async function FavorisPage() {
  const viewer = await requireOnboarded("/favoris");
  const supabase = await createClient();
  const { data } = await supabase
    .from("favorites")
    .select("id, profile:profiles!favorites_profile_id_fkey(*, candidate_details(job_title)), offer:offers(*)")
    .eq("user_id", viewer.id)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as Row[];
  const people = rows.filter((r) => r.profile && r.profile.status === "approved");
  const offers = rows.filter((r) => r.offer);

  return (
    <main className="container-page py-12">
      <h1 className="page-title">Mes favoris</h1>
      <p className="mt-2 text-muted">Les profils et les offres que vous avez mis de côté avec le cœur.</p>

      <h2 className="mt-10 section-title">Profils</h2>
      {people.length === 0 ? (
        <p className="card mt-4 p-6 text-muted">Aucun profil sauvegardé. Ouvrez une fiche dans la <Link href="/">galerie</Link> et touchez le cœur.</p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {people.map(({ profile: p }) => (
            <li key={p!.id} className="relative">
              <Link href={`/?p=${p!.id}`} className="group relative block aspect-[4/5] overflow-hidden rounded-2xl">
                <Portrait id={p!.id} src={photoUrl(p!.photo_path)} alt="" />
                <span className="absolute inset-x-0 bottom-0 flex flex-col bg-gradient-to-b from-transparent via-night/55 to-night/95 px-3 pt-12 pb-3 text-white">
                  <span className="font-display text-lg font-bold">{displayName(p!.first_name, p!.last_name)}</span>
                  <span className="text-xs font-semibold">{p!.candidate_details?.job_title ?? "Recruteur"}</span>
                </span>
              </Link>
              <div className="absolute top-3 right-3">
                <FavoriteButton profileId={p!.id} initial />
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-12 section-title">Offres</h2>
      {offers.length === 0 ? (
        <p className="card mt-4 p-6 text-muted">Aucune offre sauvegardée.</p>
      ) : (
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {offers.map(({ offer: o }) => (
            <li key={o!.id} className="card flex items-start justify-between gap-4 p-6">
              <Link href={`/offres/${o!.id}`} className="text-ink no-underline">
                <p className="inline-flex rounded-md bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand-ink">{contractLabel(o!.contract_type)}</p>
                <p className="mt-1 font-display text-xl font-bold">{o!.title}</p>
                <p className="mt-2 text-sm font-semibold">{formatRate(o!.rate_amount, o!.rate_currency, o!.rate_unit)}</p>
              </Link>
              <FavoriteButton offerId={o!.id} initial />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
