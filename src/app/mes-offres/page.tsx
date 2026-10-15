import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOnboarded } from "@/lib/viewer";
import { contractLabel, displayName } from "@/lib/labels";
import { closeOffer, setApplicationStatus } from "@/app/actions/offers";
import type { Offer, Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Mes offres" };

type AppRow = {
  id: string;
  offer_id: string;
  message: string | null;
  status: string;
  created_at: string;
  candidate: (Profile & { candidate_details: { job_title: string | null } | null }) | null;
};

const STATUS_LABEL: Record<string, string> = { sent: "Nouvelle", seen: "Vue", shortlisted: "Retenue", rejected: "Refusée" };

export default async function MesOffresPage() {
  const viewer = await requireOnboarded("/mes-offres");
  if (viewer.profile.role !== "recruiter" && !viewer.isAdmin) redirect("/candidatures");
  const supabase = await createClient();

  const { data: offersData } = await supabase.from("offers").select("*").eq("recruiter_id", viewer.id).order("created_at", { ascending: false });
  const offers = (offersData ?? []) as Offer[];
  const { data: appsData } = offers.length
    ? await supabase
        .from("applications")
        .select("id, offer_id, message, status, created_at, candidate:profiles!applications_candidate_id_fkey(*, candidate_details(job_title))")
        .in("offer_id", offers.map((o) => o.id))
        .order("created_at", { ascending: false })
    : { data: [] };
  const apps = (appsData ?? []) as unknown as AppRow[];

  return (
    <main className="container-page max-w-4xl py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="page-title">Mes offres</h1>
        <Link href="/offres/nouvelle" className="btn-primary">Publier une offre</Link>
      </div>

      {offers.length === 0 ? (
        <p className="card mt-8 p-8 text-muted">Vous n&apos;avez pas encore publié d&apos;offre.</p>
      ) : (
        <div className="mt-8 flex flex-col gap-6">
          {offers.map((o) => {
            const list = apps.filter((a) => a.offer_id === o.id);
            const closed = o.status !== "open" || new Date(o.expires_at) < new Date();
            return (
              <section key={o.id} className="card p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="inline-flex rounded-md bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand-ink">{contractLabel(o.contract_type)} {closed && "· clôturée"}</p>
                    <h2 className="mt-1 section-title"><Link href={`/offres/${o.id}`} className="text-ink">{o.title}</Link></h2>
                    <p className="text-sm text-muted">{list.length} candidature{list.length > 1 ? "s" : ""} · expire le {new Date(o.expires_at).toLocaleDateString("fr-FR")}</p>
                  </div>
                  {!closed && (
                    <form action={closeOffer.bind(null, o.id)}>
                      <button type="submit" className="btn-ghost">Clôturer</button>
                    </form>
                  )}
                </div>
                {list.length > 0 && (
                  <ul className="mt-5 divide-y divide-line border-t border-line">
                    {list.map((a) => (
                      <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                        <div>
                          <Link href={`/?p=${a.candidate?.id}`} className="font-bold text-ink">
                            {a.candidate ? displayName(a.candidate.first_name, a.candidate.last_name) : "Candidat"}
                          </Link>
                          <span className="ml-2 text-sm text-muted">{a.candidate?.candidate_details?.job_title}</span>
                          {a.message && <p className="mt-1 text-sm whitespace-pre-line">{a.message}</p>}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="rounded-full bg-subtle px-3 py-1 font-semibold">{STATUS_LABEL[a.status]}</span>
                          <form action={setApplicationStatus.bind(null, a.id, "shortlisted")}><button type="submit" className="btn-outline min-h-9 px-3">Retenir</button></form>
                          <form action={setApplicationStatus.bind(null, a.id, "rejected")}><button type="submit" className="btn-ghost min-h-9 px-3">Refuser</button></form>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
