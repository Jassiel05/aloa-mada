import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireOnboarded } from "@/lib/viewer";
import { contractLabel } from "@/lib/labels";
import { deleteAlert, toggleAlert } from "@/app/actions/alerts";
import AlertForm from "./AlertForm";

export const metadata: Metadata = { title: "Mes alertes" };

type Alert = { id: string; target: "talents" | "offers"; keyword: string | null; city: string | null; contract: string | null; active: boolean };

export default async function AlertesPage({ searchParams }: { searchParams: Promise<{ cible?: string; metier?: string; ville?: string; contrat?: string }> }) {
  const sp = await searchParams;
  const viewer = await requireOnboarded("/alertes");
  const supabase = await createClient();
  const { data } = await supabase.from("alerts").select("*").eq("user_id", viewer.id).order("created_at", { ascending: false });
  const alerts = (data ?? []) as Alert[];
  const defaultTarget = sp.cible === "offers" || sp.cible === "talents" ? sp.cible : viewer.profile.role === "candidate" ? "offers" : "talents";

  return (
    <main className="container-page max-w-3xl py-12">
      <h1 className="page-title">Mes alertes</h1>
      <p className="mt-2 text-muted">
        Recevez un email dès qu&apos;{defaultTarget === "talents" ? "un talent correspondant est validé" : "une offre correspondante est publiée"}. 10 alertes au maximum.
      </p>

      <AlertForm
        target={defaultTarget}
        allowBoth={viewer.isAdmin}
        defaults={{ keyword: sp.metier ?? "", city: sp.ville ?? "", contract: sp.contrat ?? "" }}
      />

      <h2 className="mt-12 section-title">Alertes actives</h2>
      {alerts.length === 0 ? (
        <p className="card mt-4 p-6 text-muted">Aucune alerte pour le moment.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {alerts.map((a) => (
            <li key={a.id} className={`card flex flex-wrap items-center justify-between gap-3 p-5 ${a.active ? "" : "opacity-60"}`}>
              <div>
                <p className="font-bold">
                  {a.target === "talents" ? "Talents" : "Offres"} · {[a.keyword, a.city, a.contract ? contractLabel(a.contract) : null].filter(Boolean).join(" · ")}
                </p>
                <p className="text-sm text-muted">{a.active ? "Active" : "En pause"}</p>
              </div>
              <div className="flex gap-2">
                <form action={toggleAlert.bind(null, a.id, !a.active)}>
                  <button type="submit" className="btn-outline min-h-10">{a.active ? "Mettre en pause" : "Réactiver"}</button>
                </form>
                <form action={deleteAlert.bind(null, a.id)}>
                  <button type="submit" className="btn-ghost min-h-10">Supprimer</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
