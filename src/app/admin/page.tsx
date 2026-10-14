import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireViewer } from "@/lib/viewer";
import { displayName, photoUrl } from "@/lib/labels";
import type { ProfileWithDetails } from "@/lib/types";
import Portrait from "@/components/Portrait";
import {
  approveProfile,
  approveUpgrade,
  closeReport,
  rejectProfile,
  rejectUpgrade,
  setPlan,
  setVerified,
  suspendProfile,
} from "@/app/actions/admin";

export const metadata: Metadata = { title: "Admin" };

const TABS = [
  { key: "profils", label: "Profils à valider" },
  { key: "paiements", label: "Paiements" },
  { key: "signalements", label: "Signalements" },
  { key: "membres", label: "Membres" },
];

type Upgrade = { id: string; months: number; operator: string; reference: string; amount: number | null; created_at: string; user: { id: string; first_name: string | null; last_name: string | null; role: string } | null };
type Report = { id: string; reason: string; created_at: string; target_profile_id: string | null; target_offer_id: string | null };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string }> }) {
  const viewer = await requireViewer("/admin");
  if (!viewer.isAdmin) redirect("/");
  const { tab = "profils", q } = await searchParams;
  const supabase = await createClient();

  const [{ count: nProfiles }, { count: nPayments }, { count: nReports }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("upgrade_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  const counts: Record<string, number | null> = { profils: nProfiles, paiements: nPayments, signalements: nReports, membres: null };

  return (
    <main className="container-page py-12">
      <h1 className="font-display text-4xl font-semibold tracking-tight">Back-office</h1>
      <nav aria-label="Sections admin" className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link key={t.key} href={`/admin?tab=${t.key}`} className={`rounded-full px-4 py-2.5 text-sm font-bold no-underline ${tab === t.key ? "bg-ink text-white" : "border border-field bg-white text-ink"}`}>
            {t.label}
            {counts[t.key] ? ` (${counts[t.key]})` : ""}
          </Link>
        ))}
      </nav>
      <div className="mt-8">
        {tab === "profils" && <PendingProfiles />}
        {tab === "paiements" && <Payments />}
        {tab === "signalements" && <Reports />}
        {tab === "membres" && <Members q={q} />}
      </div>
    </main>
  );
}

async function PendingProfiles() {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*, candidate_details(*), recruiter_details(*)").eq("status", "pending").order("updated_at");
  const rows = (data ?? []) as ProfileWithDetails[];
  if (!rows.length) return <p className="card p-8 text-muted">Aucun profil en attente.</p>;
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {rows.map((p) => (
        <li key={p.id} className="card flex gap-4 p-4">
          <span className="relative block aspect-[4/5] w-32 flex-none overflow-hidden rounded-xl">
            <Portrait id={p.id} src={photoUrl(p.photo_path)} alt={`Photo de ${p.first_name ?? "membre"}`} sizes="128px" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p className="font-bold">{displayName(p.first_name, p.last_name)} <span className="font-normal text-muted">· {p.role === "recruiter" ? "Recruteur" : "Candidat"}</span></p>
            <p className="text-sm text-muted">{p.candidate_details?.job_title ?? p.recruiter_details?.company_name ?? ""} {p.city ? `· ${p.city}` : ""}</p>
            {p.headline && <p className="text-sm">{p.headline}</p>}
            <div className="mt-auto flex flex-wrap gap-2">
              <form action={approveProfile.bind(null, p.id)}><button type="submit" className="btn-primary min-h-10">Valider</button></form>
              <form action={rejectProfile.bind(null, p.id)} className="flex flex-1 gap-2">
                <label htmlFor={`r-${p.id}`} className="sr-only">Motif du refus</label>
                <input id={`r-${p.id}`} name="reason" placeholder="Motif (facultatif)" className="field min-h-10 flex-1 text-sm" />
                <button type="submit" className="btn-outline min-h-10">Refuser</button>
              </form>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

async function Payments() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("upgrade_requests")
    .select("id, months, operator, reference, amount, created_at, user:profiles(id, first_name, last_name, role)")
    .eq("status", "pending")
    .order("created_at");
  const rows = (data ?? []) as unknown as Upgrade[];
  if (!rows.length) return <p className="card p-8 text-muted">Aucun paiement à vérifier.</p>;
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-line text-muted">
          <tr><th className="p-4">Membre</th><th className="p-4">Opérateur</th><th className="p-4">Référence</th><th className="p-4">Durée</th><th className="p-4">Montant (Ar)</th><th className="p-4">Date</th><th className="p-4" /></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-line last:border-0">
              <td className="p-4 font-semibold">{r.user ? displayName(r.user.first_name, r.user.last_name) : "?"} <span className="text-muted">({r.user?.role === "recruiter" ? "recruteur" : "candidat"})</span></td>
              <td className="p-4">{r.operator}</td>
              <td className="p-4 font-mono">{r.reference}</td>
              <td className="p-4">{r.months} mois</td>
              <td className="p-4">{r.amount != null ? new Intl.NumberFormat("fr-FR").format(r.amount) : "—"}</td>
              <td className="p-4">{new Date(r.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</td>
              <td className="flex gap-2 p-4">
                <form action={approveUpgrade.bind(null, r.id)}><button type="submit" className="btn-primary min-h-9 px-3">Activer Pro</button></form>
                <form action={rejectUpgrade.bind(null, r.id)}><button type="submit" className="btn-ghost min-h-9 px-3">Rejeter</button></form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function Reports() {
  const supabase = await createClient();
  const { data } = await supabase.from("reports").select("id, reason, created_at, target_profile_id, target_offer_id").eq("status", "pending").order("created_at");
  const rows = (data ?? []) as Report[];
  if (!rows.length) return <p className="card p-8 text-muted">Aucun signalement.</p>;
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((r) => (
        <li key={r.id} className="card flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="font-semibold">{r.reason}</p>
            <p className="text-sm text-muted">
              {new Date(r.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })} ·{" "}
              {r.target_profile_id ? <Link href={`/?p=${r.target_profile_id}`}>voir le profil</Link> : <Link href={`/offres/${r.target_offer_id}`}>voir l&apos;offre</Link>}
            </p>
          </div>
          <div className="flex gap-2">
            {r.target_profile_id && (
              <form action={suspendProfile.bind(null, r.target_profile_id)}><button type="submit" className="btn-outline min-h-10">Suspendre le profil</button></form>
            )}
            <form action={closeReport.bind(null, r.id)}><button type="submit" className="btn-ghost min-h-10">Classer</button></form>
          </div>
        </li>
      ))}
    </ul>
  );
}

async function Members({ q }: { q?: string }) {
  const supabase = await createClient();
  let query = supabase.from("profiles").select("*, recruiter_details(verified, kind, company_name)").order("created_at", { ascending: false }).limit(100);
  const term = (q ?? "").replace(/[%,()*]/g, " ").trim();
  if (term) query = query.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%`);
  const { data } = await query;
  const rows = (data ?? []) as ProfileWithDetails[];
  return (
    <div>
      <form method="get" className="mb-4 flex gap-2">
        <input type="hidden" name="tab" value="membres" />
        <label htmlFor="mq" className="sr-only">Rechercher un membre</label>
        <input id="mq" name="q" defaultValue={q} placeholder="Prénom ou nom" className="field max-w-sm" />
        <button type="submit" className="btn-primary">Chercher</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr><th className="p-4">Membre</th><th className="p-4">Rôle</th><th className="p-4">Statut</th><th className="p-4">Plan</th><th className="p-4">Abonnement</th><th className="p-4">Entreprise</th></tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0">
                <td className="p-4 font-semibold">{displayName(p.first_name, p.last_name)}</td>
                <td className="p-4">{p.role}</td>
                <td className="p-4">{p.status}</td>
                <td className="p-4">{p.plan}{p.plan_expires_at ? ` → ${new Date(p.plan_expires_at).toLocaleDateString("fr-FR")}` : ""}</td>
                <td className="p-4">
                  <form action={setPlan.bind(null, p.id)} className="flex gap-2">
                    <label htmlFor={`m-${p.id}`} className="sr-only">Durée</label>
                    <select id={`m-${p.id}`} name="months" className="field min-h-9 w-auto py-0 text-sm" defaultValue="1">
                      <option value="0">Simple</option>
                      <option value="1">Pro 1 mois</option>
                      <option value="3">Pro 3 mois</option>
                      <option value="12">Pro 12 mois</option>
                    </select>
                    <button type="submit" className="btn-outline min-h-9 px-3">OK</button>
                  </form>
                </td>
                <td className="p-4">
                  {p.role === "recruiter" && p.recruiter_details?.kind === "company" && (
                    <form action={setVerified.bind(null, p.id, !p.recruiter_details.verified)}>
                      <button type="submit" className="btn-ghost min-h-9 px-2">{p.recruiter_details.verified ? "Retirer le badge" : "Vérifier"}</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
