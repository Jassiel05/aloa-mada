import type { Metadata } from "next";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import SignUpForm from "./SignUpForm";
import { enabledProviders } from "@/lib/oauth";

export const metadata: Metadata = {
  title: "Créer mon profil",
  description: "Inscription gratuite pour les candidats et les recruteurs à Madagascar.",
  alternates: { canonical: "/inscription" },
};

export default async function InscriptionPage() {
  const providers = await enabledProviders();
  return (
    <AuthShell title="Créer mon profil" intro="Gratuit. Votre profil apparaît dans la galerie dès que votre photo est validée.">
      <SignUpForm providers={providers} />
      <p className="mt-6 text-sm text-muted">
        Déjà inscrit ? <Link href="/connexion" className="font-bold">Se connecter</Link>
      </p>
    </AuthShell>
  );
}
