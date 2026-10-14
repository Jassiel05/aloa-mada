import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";
import { CITIES, CONTRACTS, contractLabel, formatRate, workModeLabel } from "@/lib/labels";
import type { Offer } from "@/lib/types";

export const metadata: Metadata = { title: "Offres" };

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

  return (
    <main className="container-page py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl font-normal tracking-tight">Offres</h1>
          <p className="mt-2 text-muted">Missions, emplois et extras publiés par les recruteurs.</p>
        </div>
        {viewer?.profile.role === "recruiter" && <Link href="/offres/nouvelle" className="btn-primary">Publier une offre</Link>}
      </div>

      <form method="get" className="mt-8 flex flex-wrap gap-2.5">
        <label htmlFor="q" className="sr-only">Rechercher</label>
        <input id="q" name="q" type="search" defaultValue={sp.q} placeholder="Poste… ex. comptable" className="field min-h-12 flex-[1_1_260px] rounded-full px-5" />
        <label htmlFor="ville" className="sr-only">Ville</label>
        <select id="ville" name="ville" defaultValue={sp.ville ?? ""} className="field w-auto rounded-full font-semibold">
          <option value="">Toutes les villes</option>
          {CITIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <label htmlFor="contrat" className="sr-only">Contrat</label>
        <select id="contrat" name="contrat" defaultValue={sp.contrat ?? ""} className="field w-auto rounded-full font-semibold">
          <option value="">Tous les contrats</option>
          {CONTRACTS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <button type="submit" className="btn-primary">Filtrer</button>
      </form>

      {offers.length === 0 ? (
        <p className="card mt-10 p-10 text-center text-muted">Aucune offre pour ces critères pour le moment.</p>
      ) : (
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {offers.map((o) => (
            <li key={o.id}>
              <Link href={`/offres/${o.id}`} className="card block p-6 text-ink no-underline transition-colors hover:border-ink">
                <p className="text-xs font-bold tracking-wider text-ravinala uppercase">{contractLabel(o.contract_type)}</p>
                <h2 className="mt-2 font-display text-2xl font-semibold">{o.title}</h2>
                <p className="mt-2 text-sm font-semibold text-muted">
                  {[o.city, o.work_mode ? workModeLabel(o.work_mode) : null].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-4 font-bold">{formatRate(o.rate_amount, o.rate_currency, o.rate_unit)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
