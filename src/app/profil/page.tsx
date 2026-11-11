import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboarded } from "@/lib/viewer";
import { createClient } from "@/lib/supabase/server";
import { loadProfileInput } from "@/lib/profile-input";
import ProfileForm from "@/components/ProfileForm";
import AvailabilityToggle from "./AvailabilityToggle";
import DeleteAccount from "./DeleteAccount";
import AdminRoles from "./AdminRoles";

export const metadata: Metadata = { title: "Mon profil" };

const STATUS: Record<string, { text: string; tone: string }> = {
  draft: { text: "Profil incomplet : terminez-le pour apparaître dans la galerie.", tone: "bg-subtle text-ink" },
  pending: { text: "Profil en cours de vérification. Il apparaîtra dans la galerie dès sa validation.", tone: "bg-subtle text-ink" },
  approved: { text: "Profil validé et visible dans la galerie.", tone: "bg-brand-soft text-brand-ink" },
  rejected: { text: "Profil refusé. Corrigez le point ci-dessous puis enregistrez pour le renvoyer.", tone: "bg-danger-soft text-danger" },
};

export default async function ProfilPage({ searchParams }: { searchParams: Promise<{ bienvenue?: string; role?: string }> }) {
  const { bienvenue, role: roleParam } = await searchParams;
  const viewer = await requireOnboarded("/profil");
  const p = viewer.profile;
  const initial = await loadProfileInput(p);
  // Administrateur : « candidat » et « recruteur » sont des options en plus du rôle admin
  const adminRoles: ("candidate" | "recruiter")[] = viewer.isAdmin
    ? [...(viewer.isCandidate ? ["candidate" as const] : []), ...(viewer.isRecruiter ? ["recruiter" as const] : [])]
    : [];
  const role: "candidate" | "recruiter" = viewer.isAdmin
    ? (adminRoles.find((r) => r === roleParam) ?? adminRoles[0] ?? "candidate")
    : p.role === "recruiter" ? "recruiter" : "candidate";
  const showForm = !viewer.isAdmin || adminRoles.length > 0;
  const status = STATUS[p.status];
  const supabase = await createClient();
  const { data: views } = await supabase.rpc("my_view_count");
  const expires = p.plan_expires_at ? new Date(p.plan_expires_at).toLocaleDateString("fr-FR") : null;

  return (
    <main className="container-page max-w-3xl py-12">
      {bienvenue && (
        <p role="status" className="mb-6 rounded-2xl bg-brand-soft p-5 font-semibold text-brand-ink">
          Merci, votre profil est envoyé. Nous vérifions votre photo et vous prévenons par email dès qu&apos;il est publié.
        </p>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Mon profil</h1>
          <p className="mt-1 text-muted">
            {viewer.isAdmin
              ? `Administrateur${adminRoles.length ? `, aussi ${adminRoles.map((r) => (r === "candidate" ? "candidat" : "recruteur")).join(" et ")}` : ""}`
              : role === "candidate" ? "Candidat" : "Recruteur"}, compte {viewer.isPro ? `Pro${expires ? ` jusqu'au ${expires}` : ""}` : "Simple"}
          </p>
        </div>
        {!viewer.isPro && <Link href="/pro" className="btn-outline">Passer en Pro</Link>}
      </div>

      {showForm && (
        <p className={`mt-6 rounded-xl p-4 text-sm font-semibold ${status.tone}`}>
          {status.text}
          {p.status === "rejected" && p.rejection_reason && <span className="mt-1 block font-normal">Motif : {p.rejection_reason}</span>}
        </p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="card p-5">
          <p className="font-display text-3xl font-bold">{typeof views === "number" ? views : 0}</p>
          <p className="text-sm text-muted">vue{views === 1 ? "" : "s"} de votre fiche en 30 jours</p>
        </div>
        <Link href="/favoris" className="card p-5 text-ink no-underline transition-shadow hover:no-underline hover:shadow-soft">
          <p className="font-bold">Mes favoris</p>
          <p className="text-sm text-muted">Profils et offres sauvegardés</p>
        </Link>
        <Link href="/alertes" className="card p-5 text-ink no-underline transition-shadow hover:no-underline hover:shadow-soft">
          <p className="font-bold">Mes alertes</p>
          <p className="text-sm text-muted">Être prévenu par email</p>
        </Link>
      </div>

      {viewer.isAdmin && <AdminRoles candidate={viewer.isCandidate} recruiter={viewer.isRecruiter} />}

      {viewer.isAdmin && adminRoles.length > 1 && (
        <div role="tablist" aria-label="Profil à modifier" className="mt-8 inline-flex rounded-xl border border-line bg-white p-1 text-sm font-bold">
          {adminRoles.map((r) => (
            <Link
              key={r}
              role="tab"
              aria-selected={role === r}
              href={`/profil?role=${r}`}
              className={`rounded-lg px-4 py-2 no-underline hover:no-underline ${role === r ? "bg-night text-white" : "text-ink hover:bg-subtle"}`}
            >
              {r === "candidate" ? "Profil candidat" : "Profil recruteur"}
            </Link>
          ))}
        </div>
      )}

      {showForm && role === "candidate" && initial.candidate && (
        <AvailabilityToggle current={initial.candidate.availability} />
      )}

      {showForm && (
        <div className="mt-10">
          <ProfileForm key={role} userId={viewer.id} role={role} initial={initial} mode="edit" />
        </div>
      )}

      {!viewer.isAdmin && <DeleteAccount />}
    </main>
  );
}
