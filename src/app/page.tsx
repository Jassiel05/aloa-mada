import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";
import { CITIES, CONTRACTS } from "@/lib/labels";
import { toCard, type Card } from "@/lib/cards";
import type { Contacts, ProfileWithDetails } from "@/lib/types";
import Gallery from "@/components/Gallery";
import Portrait from "@/components/Portrait";

type Search = { q?: string; ville?: string; contrat?: string; dispo?: string; vue?: string; p?: string; n?: string; compte?: string };

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
  const filtered = Boolean(q || sp.ville || sp.contrat || sp.dispo);

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
    if (q) {
      // Recherche tolérante : sans accents ni majuscules, et par ressemblance (« electricein » → Électricien)
      const { data: ids, error: searchError } = await supabase.rpc("search_talents", { q });
      if (searchError) query = query.ilike("candidate_details.job_title", `%${q}%`);
      else query = query.in("id", ((ids ?? []) as string[]).length ? (ids as string[]) : ["00000000-0000-0000-0000-000000000000"]);
    }
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

  const showcase = cards.filter((c) => c.photo && c.available).slice(0, 3);

  const href = (patch: Partial<Search>) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v && k !== "p" && k !== "compte") next.set(k, v);
    const s = next.toString();
    return s ? `/?${s}` : "/";
  };

  const countLabel = `${cards.length}${hasMore ? "+" : ""} ${recruiters ? "recruteur" : "profil"}${cards.length > 1 ? "s" : ""}`;

  return (
    <main>
      {sp.compte === "supprime" && (
        <p role="status" className="bg-brand-soft py-3 text-center text-sm font-semibold text-brand-ink">Votre compte a été supprimé. Merci d&apos;avoir utilisé Aloa-Mada.</p>
      )}
      {/* ---------- En-tête : recherche ---------- */}
      <section className="relative overflow-hidden bg-night text-white">
        <div aria-hidden="true" className="pointer-events-none absolute -top-48 -right-32 size-[560px] rounded-full bg-aloa-purple/35 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute top-1/3 -right-56 size-[440px] rounded-full bg-aloa-pink/25 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-56 left-1/4 size-[460px] rounded-full bg-aloa-cyan/15 blur-3xl" />
        <div className="container-page relative grid items-center gap-12 py-12 sm:py-16 lg:py-20 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="max-w-2xl">
            <h1 className="font-display text-[40px] leading-[1.02] font-bold sm:text-[56px] lg:text-[64px]">
              {recruiters ? "Ils recrutent à Madagascar." : "Les talents de Madagascar, à visage découvert."}
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-white/80 sm:text-lg">
              {recruiters
                ? "Entreprises et particuliers qui cherchent du monde en ce moment. Ouvrez leur fiche et présentez-vous en un message."
                : "Électriciens, comptables, chauffeurs, développeurs, cuisiniers… Parcourez des profils avec photo vérifiée, ouvrez une fiche et écrivez directement à la personne."}
            </p>

            <form method="get" action="/" role="search" className="mt-8 rounded-2xl bg-white p-2 text-ink shadow-lift">
              {recruiters && <input type="hidden" name="vue" value="recruteurs" />}
              <div className={`grid gap-2 ${recruiters ? "sm:grid-cols-[1fr_200px_auto]" : "sm:grid-cols-[1fr_1fr_auto]"}`}>
                <div className={`relative ${recruiters ? "" : "sm:col-span-3"}`}>
                  <label htmlFor="q" className="sr-only">{recruiters ? "Entreprise ou secteur" : "Métier"}</label>
                  <svg aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                  <input id="q" name="q" type="search" defaultValue={sp.q} placeholder={recruiters ? "Entreprise, secteur…" : "Métier, ex. électricien"} className="field border-transparent bg-subtle pl-11" />
                </div>
                <div>
                  <label htmlFor="ville" className="sr-only">Ville</label>
                  <select id="ville" name="ville" defaultValue={sp.ville ?? ""} className="field border-transparent bg-subtle font-semibold">
                    <option value="">Toutes les villes</option>
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {!recruiters && (
                  <div>
                    <label htmlFor="contrat" className="sr-only">Type de contrat</label>
                    <select id="contrat" name="contrat" defaultValue={sp.contrat ?? ""} className="field border-transparent bg-subtle font-semibold">
                      <option value="">Tous les contrats</option>
                      {CONTRACTS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                )}
                <button type="submit" className="btn-primary min-h-12 px-6 text-[15px]">Rechercher</button>
              </div>
              {!recruiters && (
                <label className="mt-1 flex min-h-10 cursor-pointer items-center gap-2.5 px-3 text-sm font-semibold">
                  <input type="checkbox" name="dispo" value="1" defaultChecked={sp.dispo === "1"} className="size-4 accent-brand" />
                  Seulement les personnes disponibles maintenant
                </label>
              )}
            </form>

            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
              {["Chaque photo vérifiée avant publication", "Inscription gratuite", "Contact direct, sans intermédiaire"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fd9134" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {showcase.length === 3 && <Showcase cards={showcase} />}
        </div>
      </section>

      {/* ---------- Résultats ---------- */}
      <section id="profils" className="container-page scroll-mt-20 pt-10 sm:pt-12">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="section-title">{recruiters ? "Recruteurs" : filtered ? "Résultats" : "Profils disponibles"}</h2>
            {!error && (cards.length > 0 || filtered) && <p className="mt-1 text-sm text-muted">{cards.length > 0 ? countLabel : "Aucun résultat"}{filtered && <> · <Link href={recruiters ? "/?vue=recruteurs" : "/"}>Effacer les filtres</Link></>}</p>}
          </div>
          <div role="tablist" aria-label="Type de profils" className="inline-flex rounded-xl border border-line bg-white p-1 text-sm font-bold">
            <Link role="tab" aria-selected={!recruiters} href={href({ vue: undefined, contrat: undefined, dispo: undefined })} className={`rounded-lg px-4 py-2 no-underline hover:no-underline ${!recruiters ? "bg-night text-white" : "text-ink hover:bg-subtle"}`}>Talents</Link>
            <Link role="tab" aria-selected={recruiters} href={href({ vue: "recruteurs", contrat: undefined, dispo: undefined })} className={`rounded-lg px-4 py-2 no-underline hover:no-underline ${recruiters ? "bg-night text-white" : "text-ink hover:bg-subtle"}`}>Recruteurs</Link>
          </div>
        </div>

        {error ? (
          <p role="alert" className="rounded-2xl bg-danger-soft p-5 font-semibold text-danger">
            Les profils n&apos;ont pas pu être chargés. Rechargez la page dans un instant.
          </p>
        ) : cards.length === 0 ? (
          <EmptyState filtered={filtered} recruiters={recruiters} loggedIn={Boolean(viewer)} />
        ) : (
          <Gallery
            cards={cards}
            initialId={sp.p ?? null}
            viewer={viewer ? { id: viewer.id, canStart: viewer.can.startConversation, seeContacts: viewer.can.seeContacts, favorites } : null}
          />
        )}

        {hasMore && (
          <div className="mt-10 text-center">
            <Link href={href({ n: String(limit + PAGE) })} scroll={false} className="btn-outline min-h-12 px-8">Afficher plus de profils</Link>
          </div>
        )}

        {viewer && (viewer.profile.role === "recruiter" || viewer.isAdmin) && !recruiters && (q || sp.ville || sp.contrat) && (
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-brand-soft p-5 sm:p-6">
            <p className="font-semibold text-brand-ink">Recevez un email dès qu&apos;un nouveau profil correspond à cette recherche.</p>
            <Link
              href={`/alertes?${new URLSearchParams({ cible: "talents", ...(q ? { metier: q } : {}), ...(sp.ville ? { ville: sp.ville } : {}), ...(sp.contrat ? { contrat: sp.contrat } : {}) }).toString()}`}
              className="btn-primary"
            >
              Créer une alerte
            </Link>
          </div>
        )}
      </section>

      {!viewer && <HowItWorks />}
    </main>
  );
}

/** Trois vrais portraits en éventail, à droite du titre (grand écran). */
function Showcase({ cards }: { cards: Card[] }) {
  const placement = ["-rotate-6 translate-y-6", "z-10 -mx-10 scale-105", "rotate-6 translate-y-6"];
  return (
    <div aria-hidden="true" className="hidden justify-center xl:flex">
      {cards.map((c, i) => (
        <div key={c.id} className={`relative w-48 flex-none xl:w-52 ${placement[i]}`}>
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-lift ring-4 ring-night">
            <Portrait id={c.id} src={c.photo} alt="" sizes="210px" priority />
            <div className="absolute inset-x-2 bottom-2 rounded-xl bg-white/95 px-3 py-2 text-ink">
              <p className="truncate text-sm font-bold">{c.title}</p>
              <p className="truncate text-xs text-muted">{c.name}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ filtered, recruiters, loggedIn }: { filtered: boolean; recruiters: boolean; loggedIn: boolean }) {
  if (filtered) {
    return (
      <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
        <p className="font-display text-2xl font-bold">Aucun profil ne correspond à cette recherche</p>
        <p className="max-w-md text-muted">Essayez un métier plus large, une autre ville, ou retirez le filtre de disponibilité.</p>
        <Link href={recruiters ? "/?vue=recruteurs" : "/"} className="btn-outline mt-3">Voir tous les profils</Link>
      </div>
    );
  }
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <p className="font-display text-2xl font-bold">{recruiters ? "Les premiers recruteurs arrivent" : "Les premiers profils arrivent"}</p>
      <p className="max-w-md text-muted">
        {recruiters
          ? "Chaque fiche est vérifiée avant d'être publiée. Revenez bientôt, ou créez votre profil pour être visible dès aujourd'hui."
          : "Chaque photo est vérifiée avant publication. Créez votre profil maintenant pour faire partie des premiers visibles."}
      </p>
      {!loggedIn && <Link href="/inscription" className="btn-primary mt-3">Créer mon profil</Link>}
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { title: "Créez votre profil", text: "Photo portrait, métier, ville, type de contrat et disponibilité. Comptez cinq minutes." },
    { title: "Votre photo est vérifiée", text: "Notre équipe valide chaque profil avant publication : pas de faux comptes dans la galerie." },
    { title: "Échangez directement", text: "Ouvrez une fiche, envoyez un message, recevez la réponse par email et dans votre messagerie." },
  ];
  const audiences = [
    {
      title: "Vous cherchez du travail",
      points: ["Un profil visible par les recruteurs de tout Madagascar", "Indiquez si vous êtes disponible ou déjà en poste", "Répondez gratuitement aux recruteurs qui vous écrivent"],
      cta: "Créer mon profil candidat",
    },
    {
      title: "Vous recrutez",
      points: ["Des visages et des métiers, triés par ville et contrat", "Contactez les candidats directement, sans agence", "Publiez vos offres et recevez les candidatures (Pro)"],
      cta: "Créer mon profil recruteur",
    },
  ];
  return (
    <section className="container-page mt-20">
      <div className="max-w-2xl">
        <h2 className="font-display text-[32px] leading-tight font-bold sm:text-[40px]">Comment ça marche</h2>
        <p className="mt-3 text-lg text-muted">Trois étapes, sans CV à rédiger ni intermédiaire.</p>
      </div>
      <ol className="mt-10 grid gap-4 md:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} className="card p-6 sm:p-7">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-soft font-display text-lg font-bold text-brand-ink">{i + 1}</span>
            <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
            <p className="mt-2 leading-relaxed text-muted">{s.text}</p>
          </li>
        ))}
      </ol>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {audiences.map((a, i) => (
          <div key={a.title} className={`rounded-2xl p-7 sm:p-9 ${i === 0 ? "bg-white ring-1 ring-line" : "bg-night text-white"}`}>
            <h3 className="font-display text-[26px] leading-tight font-bold">{a.title}</h3>
            <ul className="mt-5 flex flex-col gap-3">
              {a.points.map((p) => (
                <li key={p} className="flex gap-3">
                  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={i === 0 ? "#0277c2" : "#fd9134"} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-none"><path d="M5 12l5 5L20 7" /></svg>
                  <span className={i === 0 ? "" : "text-white/85"}>{p}</span>
                </li>
              ))}
            </ul>
            <Link href="/inscription" className={`${i === 0 ? "btn-primary" : "btn bg-white text-night hover:bg-white/90"} mt-7 min-h-12 px-6`}>{a.cta}</Link>
          </div>
        ))}
      </div>
    </section>
  );
}
