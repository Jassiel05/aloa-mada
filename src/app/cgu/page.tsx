import type { Metadata } from "next";

export const metadata: Metadata = { title: "Conditions générales d'utilisation" };

export default function CguPage() {
  return (
    <main className="container-page max-w-3xl py-12 leading-relaxed">
      <h1 className="font-display text-4xl font-semibold tracking-tight">Conditions générales d&apos;utilisation</h1>
      <p className="mt-4 rounded-xl bg-laterite-soft p-4 text-sm font-semibold text-laterite-dark">
        Modèle à faire relire par un juriste avant la mise en ligne.
      </p>
      <h2 className="mt-8 font-display text-2xl font-semibold">1. Objet</h2>
      <p className="mt-2">Aloa-Mada met en relation des candidats et des recruteurs à Madagascar. [ÉDITEUR DU SITE, ADRESSE, CONTACT]</p>
      <h2 className="mt-8 font-display text-2xl font-semibold">2. Inscription et profil</h2>
      <p className="mt-2">Chaque membre fournit des informations exactes et une photo portrait récente et correcte. Les profils sont vérifiés avant publication et peuvent être refusés ou suspendus.</p>
      <h2 className="mt-8 font-display text-2xl font-semibold">3. Comptes Simple et Pro</h2>
      <p className="mt-2">Le compte Simple est gratuit. Le compte Pro est payant pour la durée choisie et n&apos;est pas reconduit automatiquement. [CONDITIONS DE REMBOURSEMENT]</p>
      <h2 className="mt-8 font-display text-2xl font-semibold">4. Comportements interdits</h2>
      <p className="mt-2">Faux profils, harcèlement, demandes d&apos;argent aux candidats, offres illégales ou trompeuses, collecte massive des données des membres.</p>
      <h2 className="mt-8 font-display text-2xl font-semibold">5. Responsabilité</h2>
      <p className="mt-2">Aloa-Mada n&apos;est pas partie aux contrats conclus entre membres. [À COMPLÉTER]</p>
    </main>
  );
}
