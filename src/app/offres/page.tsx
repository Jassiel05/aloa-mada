import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";
import { CITIES, CONTRACTS, contractLabel, formatRate, workModeLabel } from "@/lib/labels";
import type { Offer } from "@/lib/types";

export const metadata: Metadata = {
  title: "Offres d'emploi et missions à Madagascar",
  description: "CDI, CDD, freelance, stages et extras publiés par les recruteurs sur Aloa-Mada.",
  alternates: { canonical: "/offres" },
};

export default async function OffresPage({ searchParams }: { searchParams: Promise<{ q?: string; ville?: string; contrat?: string }> }) {
  const sp = await searchParams;
  const viewer = await getViewer();
  const supabase = await createClient();
  const q = (sp.q ?? "").replace(/[%,()*]/g, " ").trim();

  let query = supabase
    .from("offers")
    .select("*")
    .eq("status", "open")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(60);
  if (q) query = query.ilike("title", `%${q}%`);
  if (sp.ville) query = query.eq("city", sp.ville);
  if (sp.contrat) query = query.eq("contract_type", sp.contrat);
  const { data } = await query;
  const offers = (data ?? []) as Offer[];

  const isRecruiter = viewer?.profile.role === "recruiter";
  const filtered = Boolean(q || sp.ville || sp.contrat);
  const age = (d: string) => {
    const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    return days <= 0 ? "Publiée aujourd'hui" : days === 1 ? "Publiée hier" : `Publiée il y a ${days} jours`;
  };

  return (
    <main>
      <section className="border-b border-line bg-white">
        <div className="container-page py-10 sm:py-14">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="page-title">Offres d&apos;emploi et missions</h1>
              <p className="mt-3 text-lg text-muted">CDI, CDD, freelance, stages et extras publiés par des recruteurs à Madagascar.</p>
            </div>
            {isRecruiter && <Link href="/offres/nouvelle" className="btn-primary min-h-12 px-6">Publier une offre</Link>}
          </div>

          <form method="get" role="search" className="mt-8 grid gap-2 rounded-2xl bg-subtle p-2 sm:grid-cols-[1fr_1fr_auto] lg:grid-cols-[1.6fr_1fr_1fr_auto]">
            <div className="relative sm:col-span-3 lg:col-span-1">
              <label htmlFor="q" className="sr-only">Poste recherché</label>
              <svg aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <input id="q" name="q" type="search" defaultValue={sp.q} placeholder="Poste, ex. comptable" className="field border-transparent pl-11" />
            </div>
            <div>
              <label htmlFor="ville" className="sr-only">Ville</label>
              <select id="ville" name="ville" defaultValue={sp.ville ?? ""} className="field border-transparent font-semibold">
                <option value="">Toutes les villes</option>
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="contrat" className="sr-only">Type de contrat</label>
              <select id="contrat" name="contrat" defaultValue={sp.contrat ?? ""} className="field border-transparent font-semibold">
                <option value="">Tous les contrats</option>
                {CONTRACTS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <button type="submit" className="btn-primary min-h-12 px-6">Rechercher</button>
          </form>
        </div>
      </section>

      <section className="container-page pt-8">
        <p className="mb-5 text-sm text-muted">
          {offers.length} offre{offers.length > 1 ? "s" : ""} ouverte{offers.length > 1 ? "s" : ""}
          {filtered && <> · <Link href="/offres">Effacer les filtres</Link></>}
        </p>
        {offers.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
            <p className="font-display text-2xl font-bold">{filtered ? "Aucune offre pour cette recherche" : "Aucune offre ouverte pour le moment"}</p>
            <p className="max-w-md text-muted">
              {filtered ? "Élargissez la recherche ou créez une alerte pour être prévenu des prochaines offres." : "Créez une alerte et recevez un email dès qu'une offre correspondant à votre métier est publiée."}
            </p>
            <Link href={viewer ? "/alertes?cible=offers" : "/inscription"} className="btn-outline mt-3">{viewer ? "Créer une alerte" : "Créer mon profil"}</Link>
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {offers.map((o) => (
              <li key={o.id}>
                <Link href={`/offres/${o.id}`} className="card group flex h-full flex-col p-6 text-ink no-underline transition-shadow hover:no-underline hover:shadow-lift">
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex rounded-md bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand-ink">{contractLabel(o.contract_type)}</span>
                    <span className="text-xs text-muted">{age(o.created_at)}</span>
                  </div>
                  <h2 className="mt-3 font-display text-[22px] leading-snug font-bold group-hover:text-brand-dark">{o.title}</h2>
                  <p className="mt-1.5 text-sm text-muted">
                    {[o.city ?? "Lieu à préciser", o.work_mode ? workModeLabel(o.work_mode) : null].filter(Boolean).join(", ")}
                  </p>
                  <p className="mt-auto pt-5 font-bold">{formatRate(o.rate_amount, o.rate_currency, o.rate_unit)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
