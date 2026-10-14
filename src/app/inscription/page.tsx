import type { Metadata } from "next";
import Link from "next/link";
import SignUpForm from "./SignUpForm";

export const metadata: Metadata = { title: "Créer mon profil" };

export default function InscriptionPage() {
  return (
    <main className="container-page grid min-h-[70vh] place-items-center py-16">
      <div className="w-full max-w-lg">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Créer mon profil</h1>
        <p className="mt-2 text-muted">Gratuit. Votre profil apparaît dans la galerie après validation de votre photo.</p>
        <SignUpForm />
        <p className="mt-6 text-sm text-muted">
          Déjà inscrit ? <Link href="/connexion" className="font-bold">Se connecter</Link>
        </p>
      </div>
    </main>
  );
}
