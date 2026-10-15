import type { Metadata } from "next";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import SignInForm from "./SignInForm";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

export default async function ConnexionPage({ searchParams }: { searchParams: Promise<{ next?: string; erreur?: string }> }) {
  const { next, erreur } = await searchParams;
  return (
    <AuthShell title="Connexion" intro="Retrouvez vos messages, vos favoris et votre profil.">
      {erreur === "lien" && (
        <p role="alert" className="mt-6 rounded-xl bg-danger-soft p-4 text-sm font-semibold text-danger">
          Ce lien de confirmation a expiré ou a déjà été utilisé. Connectez-vous avec votre email et votre mot de passe.
        </p>
      )}
      <SignInForm next={next ?? "/"} />
      <p className="mt-6 text-sm text-muted">
        Pas encore de compte ? <Link href="/inscription" className="font-bold">Créer mon profil gratuitement</Link>
      </p>
    </AuthShell>
  );
}
