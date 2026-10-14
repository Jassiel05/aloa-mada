import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireOnboarded } from "@/lib/viewer";
import { contractLabel } from "@/lib/labels";

export const metadata: Metadata = { title: "Mes candidatures" };

const STATUS_LABEL: Record<string, string> = { sent: "Envoyée", seen: "Vue par le recruteur", shortlisted: "Retenue", rejected: "Non retenue" };

type Row = { id: string; status: string; created_at: string; offer: { id: string; title: string; contract_type: string; city: string | null } | null };

export default async function CandidaturesPage() {
  const viewer = await requireOnboarded("/candidatures");
  const supabase = await createClient();
  const { data } = await supabase
    .from("applications")
    .select("id, status, created_at, offer:offers(id, title, contract_type, city)")
    .eq("candidate_id", viewer.id)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as Row[];

  return (
    <main className="container-page max-w-3xl py-12">
      <h1 className="font-display text-4xl font-semibold tracking-tight">Mes candidatures</h1>
      {!viewer.isPro && (
        <p className="mt-4 rounded-xl bg-sand p-4 text-sm">
          En compte Simple, les recruteurs vous contactent directement. <Link href="/pro" className="font-bold">Passez en Pro</Link> pour postuler aux offres.
        </p>
      )}
      {rows.length === 0 ? (
        <p className="card mt-8 p-8 text-muted">Aucune candidature pour le moment. <Link href="/offres">Voir les offres</Link></p>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.id} className="card flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <Link href={`/offres/${r.offer?.id}`} className="font-bold text-ink">{r.offer?.title}</Link>
                <p className="text-sm text-muted">{r.offer ? contractLabel(r.offer.contract_type) : ""}{r.offer?.city ? ` · ${r.offer.city}` : ""} · {new Date(r.created_at).toLocaleDateString("fr-FR")}</p>
              </div>
              <span className="rounded-full bg-sand px-3 py-1 text-sm font-semibold">{STATUS_LABEL[r.status]}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
