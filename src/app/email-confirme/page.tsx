import type { Metadata } from "next";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import { getViewer } from "@/lib/viewer";
import ResendForm from "./ResendForm";

export const metadata: Metadata = { title: "Confirmation de l'email", robots: { index: false } };

function Done() {
  return (
    <span className="mt-8 grid size-14 place-items-center rounded-full bg-available text-white" aria-hidden="true">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
    </span>
  );
}

export default async function EmailConfirmePage({ searchParams }: { searchParams: Promise<{ etat?: string }> }) {
  const { etat } = await searchParams;
  const viewer = await getViewer();

  if (etat === "expire") {
    return (
      <AuthShell title="Ce lien a expiré" intro="Le lien de confirmation n'est valable qu'une fois et pendant une durée limitée. Recevez-en un nouveau en quelques secondes.">
        <ResendForm />
        <p className="mt-6 text-sm text-muted">
          Déjà confirmé ? <Link href="/connexion" className="font-bold">Se connecter</Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Email confirmé" intro="Merci ! Votre compte Aloa-Mada est activé.">
      <Done />
      {viewer ? (
        <>
          <p className="mt-6 text-[17px]">
            {viewer.profile.onboarded
              ? "Vous êtes connecté. Vous pouvez retrouver votre profil et vos messages."
              : "Dernière étape : ajoutez votre photo et votre métier pour apparaître dans la galerie."}
          </p>
          <Link href={viewer.profile.onboarded ? "/profil" : "/onboarding"} className="btn-primary mt-6 min-h-12 px-6 text-base">
            {viewer.profile.onboarded ? "Voir mon profil" : "Compléter mon profil"}
          </Link>
        </>
      ) : (
        <>
          <p className="mt-6 text-[17px]">Connectez-vous avec votre email et votre mot de passe pour compléter votre profil.</p>
          <Link href="/connexion?next=/onboarding" className="btn-primary mt-6 min-h-12 px-6 text-base">Se connecter</Link>
        </>
      )}
    </AuthShell>
  );
}
