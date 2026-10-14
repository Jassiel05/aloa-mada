import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";
import { CITIES, CONTRACTS } from "@/lib/labels";
import { toCard } from "@/lib/cards";
import type { Contacts, ProfileWithDetails } from "@/lib/types";
import Gallery from "@/components/Gallery";

type Search = { q?: string; ville?: string; contrat?: string; dispo?: string; vue?: string; p?: string; n?: string };

export const metadata: Metadata = { alternates: { canonical: "/" } };

const PAGE = 48;
const MAX = 480;

export default async function HomePage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const recruiters = sp.vue === "recruteurs";
  const q = (sp.q ?? "").replace(/[%,()*]/g, " ").trim();
  const viewer = await getViewer();
  const supabase = await createClient();
  const limit = Math.min(MAX, Math.max(PAGE, Number(sp.n) || PAGE));

  const details = recruiters ? "recruiter_details(*)" : "candidate_details!inner(*)";
  let query = supabase
    .from("profiles")
    .select(`*, ${details}`)
    .eq("status", "approved")
    .eq("role", recruiters ? "recruiter" : "candidate")
    .order("updated_at", { ascending: false })
    .limit(limit + 1);

  if (sp.ville) query = query.eq("city", sp.ville);
  if (!recruiters) {
    if (q) query = query.ilike("candidate_details.job_title", `%${q}%`);
    if (sp.contrat) query = query.contains("candidate_details.contract_types", [sp.contrat]);
    if (sp.dispo === "1") query = query.neq("candidate_details.availability", "employed");
  } else if (q) {
    query = query.ilike("headline", `%${q}%`);
  }

  const { data, error } = await query;
  const fetched = (data ?? []) as unknown as ProfileWithDetails[];
  const hasMore = fetched.length > limit;
  const rows = fetched.slice(0, limit);

  // Lien direct vers une fiche (?p=…) : on l'ajoute même si elle n'est pas dans la page chargée
  if (sp.p && !rows.some((r) => r.id === sp.p)) {
    const { data: one } = await supabase
      .from("profiles")
      .select("*, candidate_details(*), recruiter_details(*)")
      .eq("id", sp.p)
      .eq("status", "approved")
      .maybeSingle();
    if (one) rows.unshift(one as unknown as ProfileWithDetails);
  }

  let favorites: string[] = [];
  if (viewer) {
    const { data: favs } = await supabase.from("favorites").select("profile_id").eq("user_id", viewer.id).not("profile_id", "is", null);
    favorites = (favs ?? []).map((f: { profile_id: string }) => f.profile_id);
  }

  let contacts = new Map<string, Contacts>();
  if (viewer?.can.seeContacts && rows.length) {
    const { data: c } = await supabase.from("profile_contacts").select("*").in("profile_id", rows.map((r) => r.id));
    contacts = new Map((c ?? []).map((x: Contacts) => [x.profile_id, x]));
  }

  const cards = rows
    .map((r) => toCard({ ...r, candidate_details: r.candidate_details ?? null, recruiter_details: r.recruiter_details ?? null }, contacts.get(r.id)))
    .sort((a, b) => Number(b.available) - Number(a.available) || Number(b.isPro) - Number(a.isPro));

  const filterHref = (patch: Partial<Search>) => {
    const next = new URLSearchParams();
    const merged = { ...sp, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v && k !== "p") next.set(k, v);
    const s = next.toString();
    return s ? `/?${s}` : "/";
  };

  return (
    <main>
      <section className="container-page flex flex-wrap items-end justify-between gap-8 pt-12 pb-6 sm:pt-16">
        <div className="max-w-2xl">
          <p className="mb-3 text-[13px] font-bold tracking-[1.5px] text-ravinala uppercase">Recrutement direct · Madagascar</p>
          <h1 className="font-display text-[40px] leading-[1.05] font-normal tracking-tight sm:text-6xl">
            {recruiters ? (
              <>Ils recrutent,<br />écrivez-leur.</>
            ) : (
              <>Des visages,<br />pas des CV.</>
            )}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            Parcourez les profils, ouvrez une fiche, envoyez un message. La bonne personne en deux clics.
          </p>
        </div>
        <div className="flex rounded-full border border-field bg-white p-1 text-sm font-bold">
          <Link href={filterHref({ vue: undefined, contrat: undefined, dispo: undefined })} className={`rounded-full px-4 py-2.5 no-underline ${!recruiters ? "bg-ink text-white" : "text-ink"}`}>Talents</Link>
          <Link href={filterHref({ vue: "recruteurs", contrat: undefined, dispo: undefined })} className={`rounded-full px-4 py-2.5 no-underline ${recruiters ? "bg-ink text-white" : "text-ink"}`}>Recruteurs</Link>
        </div>
      </section>

      <form method="get" className="sticky top-0 z-10 border-y border-line bg-ivory/95 backdrop-blur">
        <div className="container-page flex flex-wrap items-center gap-2.5 py-3">
          {recruiters && <input type="hidden" name="vue" value="recruteurs" />}
          <label htmlFor="q" className="sr-only">Rechercher</label>
          <input id="q" name="q" type="search" defaultValue={sp.q} placeholder={recruiters ? "Entreprise, secteur…" : "Métier… ex. électricien"} className="field min-h-12 flex-[1_1_260px] rounded-full px-5" />
          <label htmlFor="ville" className="sr-only">Ville</label>
          <select id="ville" name="ville" defaultValue={sp.ville ?? ""} className="field min-h-11 w-auto rounded-full font-semibold">
            <option value="">Toutes les villes</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {!recruiters && (
            <>
              <label htmlFor="contrat" className="sr-only">Contrat</label>
              <select id="contrat" name="contrat" defaultValue={sp.contrat ?? ""} className="field min-h-11 w-auto rounded-full font-semibold">
                <option value="">Tous les contrats</option>
                {CONTRACTS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <label className="chip">
                <input type="checkbox" name="dispo" value="1" defaultChecked={sp.dispo === "1"} className="sr-only" />
                <span className="size-2 rounded-full bg-ravinala" aria-hidden="true" /> Disponible maintenant
              </label>
            </>
          )}
          <button type="submit" className="btn-primary">Filtrer</button>
        </div>
      </form>

      <div className="container-page py-8">
        {error && <p role="alert" className="mb-6 rounded-xl bg-laterite-soft p-4 font-semibold text-laterite-dark">Chargement impossible : vérifiez la configuration Supabase.</p>}
        {cards.length === 0 && !error ? (
          <div className="card mx-auto max-w-lg p-10 text-center">
            <p className="font-display text-2xl">Aucun profil ne correspond.</p>
            <p className="mt-2 text-muted">Essayez une autre ville ou retirez un filtre.</p>
            <Link href="/" className="btn-outline mt-6">Voir tous les profils</Link>
          </div>
        ) : (
          <Gallery
            cards={cards}
            initialId={sp.p ?? null}
            viewer={viewer ? { id: viewer.id, canStart: viewer.can.startConversation, favorites } : null}
          />
        )}
        {hasMore && (
          <div className="mt-10 text-center">
            <Link href={filterHref({ n: String(limit + PAGE) })} scroll={false} className="btn-outline min-h-12 px-8">Voir plus de profils</Link>
          </div>
        )}
        {viewer && (viewer.profile.role === "recruiter" || viewer.isAdmin) && !recruiters && (q || sp.ville || sp.contrat) && (
          <p className="mt-8 text-center text-sm text-muted">
            Personne ne correspond encore ?{" "}
            <Link href={`/alertes?${new URLSearchParams({ cible: "talents", ...(q ? { metier: q } : {}), ...(sp.ville ? { ville: sp.ville } : {}), ...(sp.contrat ? { contrat: sp.contrat } : {}) }).toString()}`} className="font-bold">
              Créez une alerte avec ces critères
            </Link>{" "}
            et recevez un email dès qu&apos;un profil arrive.
          </p>
        )}
      </div>
    </main>
  );
}
