import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboarded } from "@/lib/viewer";
import { loadProfileInput } from "@/lib/profile-input";
import ProfileForm from "@/components/ProfileForm";
import AvailabilityToggle from "./AvailabilityToggle";

export const metadata: Metadata = { title: "Mon profil" };

const STATUS: Record<string, { text: string; tone: string }> = {
  draft: { text: "Profil incomplet : terminez-le pour apparaître dans la galerie.", tone: "bg-sand text-ink" },
  pending: { text: "Profil en cours de vérification. Il apparaîtra dans la galerie dès sa validation.", tone: "bg-sand text-ink" },
  approved: { text: "Profil validé et visible dans la galerie.", tone: "bg-ravinala-soft text-ravinala-ink" },
  rejected: { text: "Profil refusé. Corrigez le point ci-dessous puis enregistrez pour le renvoyer.", tone: "bg-laterite-soft text-laterite-dark" },
};

export default async function ProfilPage({ searchParams }: { searchParams: Promise<{ bienvenue?: string }> }) {
  const { bienvenue } = await searchParams;
  const viewer = await requireOnboarded("/profil");
  const p = viewer.profile;
  const initial = await loadProfileInput(p);
  const role = p.role === "recruiter" ? "recruiter" : "candidate";
  const status = STATUS[p.status];
  const expires = p.plan_expires_at ? new Date(p.plan_expires_at).toLocaleDateString("fr-FR") : null;

  return (
    <main className="container-page max-w-3xl py-12">
      {bienvenue && (
        <p role="status" className="mb-6 rounded-2xl bg-ravinala-soft p-5 font-semibold text-ravinala-ink">
          Merci ! Votre profil est envoyé. Nous vérifions votre photo, en général sous 24 h.
        </p>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Mon profil</h1>
          <p className="mt-1 text-muted">
            {role === "candidate" ? "Candidat" : "Recruteur"} · {viewer.isPro ? `Pro${expires ? ` jusqu'au ${expires}` : ""}` : "Simple"}
          </p>
        </div>
        {!viewer.isPro && <Link href="/pro" className="btn-outline">Passer en Pro</Link>}
      </div>

      <p className={`mt-6 rounded-xl p-4 text-sm font-semibold ${status.tone}`}>
        {status.text}
        {p.status === "rejected" && p.rejection_reason && <span className="mt-1 block font-normal">Motif : {p.rejection_reason}</span>}
      </p>

      {role === "candidate" && initial.candidate && (
        <AvailabilityToggle current={initial.candidate.availability} />
      )}

      <div className="mt-10">
        <ProfileForm userId={viewer.id} role={role} initial={initial} mode="edit" />
      </div>
    </main>
  );
}
