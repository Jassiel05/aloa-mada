import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOnboarded } from "@/lib/viewer";
import OfferForm from "./OfferForm";

export const metadata: Metadata = { title: "Publier une offre" };

export default async function NewOfferPage() {
  const viewer = await requireOnboarded("/offres/nouvelle");
  if (viewer.profile.role === "candidate") redirect("/offres");

  return (
    <main className="container-page max-w-3xl py-12">
      <h1 className="font-display text-4xl font-semibold tracking-tight">Publier une offre</h1>
      {!viewer.can.publishOffer ? (
        <div className="card mt-8 p-8">
          <p className="font-display text-2xl">
            {viewer.isPro ? "Votre profil est en cours de validation." : "La publication d'offres est réservée aux recruteurs Pro."}
          </p>
          <p className="mt-2 text-muted">
            {viewer.isPro
              ? "Vous pourrez publier dès que votre profil sera validé."
              : "En compte Simple, vous pouvez déjà parcourir la galerie et contacter les talents directement."}
          </p>
          {!viewer.isPro && <Link href="/pro" className="btn-primary mt-6">Passer en Recruteur Pro</Link>}
        </div>
      ) : (
        <OfferForm />
      )}
    </main>
  );
}
