import type { Metadata } from "next";
import Link from "next/link";
import SignInForm from "./SignInForm";

export const metadata: Metadata = { title: "Connexion" };

export default async function ConnexionPage({ searchParams }: { searchParams: Promise<{ next?: string; erreur?: string }> }) {
  const { next, erreur } = await searchParams;
  return (
    <main className="container-page grid min-h-[70vh] place-items-center py-16">
      <div className="w-full max-w-md">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Bon retour</h1>
        <p className="mt-2 text-muted">Connectez-vous pour contacter les talents et les recruteurs.</p>
        {erreur === "lien" && (
          <p role="alert" className="mt-6 rounded-xl bg-laterite-soft p-4 text-sm font-semibold text-laterite-dark">
            Le lien a expiré ou a déjà servi. Connectez-vous avec votre mot de passe.
          </p>
        )}
        <SignInForm next={next ?? "/"} />
        <p className="mt-6 text-sm text-muted">
          Pas encore de compte ? <Link href="/inscription" className="font-bold">Créer mon profil</Link>
        </p>
      </div>
    </main>
  );
}
