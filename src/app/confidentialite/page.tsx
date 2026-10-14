import type { Metadata } from "next";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function ConfidentialitePage() {
  return (
    <main className="container-page max-w-3xl py-12 leading-relaxed">
      <h1 className="font-display text-4xl font-semibold tracking-tight">Politique de confidentialité</h1>
      <p className="mt-4 rounded-xl bg-laterite-soft p-4 text-sm font-semibold text-laterite-dark">
        Modèle à adapter (loi malgache n° 2014-038 sur la protection des données personnelles) et à faire relire.
      </p>
      <h2 className="mt-8 font-display text-2xl font-semibold">Données collectées</h2>
      <p className="mt-2">Identité, ville, photo, informations professionnelles, prétentions, coordonnées et messages échangés sur la plateforme.</p>
      <h2 className="mt-8 font-display text-2xl font-semibold">Qui voit quoi</h2>
      <ul className="mt-2 list-disc pl-5">
        <li>Le public voit le portrait, le prénom et l&apos;initiale, le métier et la ville.</li>
        <li>Les membres connectés voient la fiche complète.</li>
        <li>Le téléphone et l&apos;email ne sont visibles que par les recruteurs et les candidats Pro, jamais par les candidats Simple ni par le public.</li>
      </ul>
      <h2 className="mt-8 font-display text-2xl font-semibold">Vos droits</h2>
      <p className="mt-2">Vous pouvez consulter, corriger ou supprimer vos données à tout moment en écrivant à [EMAIL DE CONTACT].</p>
      <h2 className="mt-8 font-display text-2xl font-semibold">Hébergement</h2>
      <p className="mt-2">Données hébergées chez Supabase ([RÉGION CHOISIE]) et site servi par Vercel.</p>
    </main>
  );
}
