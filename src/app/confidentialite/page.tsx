import type { Metadata } from "next";
import { getSettings } from "@/lib/pricing";
import LegalPage, { Publisher } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  alternates: { canonical: "/confidentialite" },
};

export default async function ConfidentialitePage() {
  const s = await getSettings();
  const contact = s.contact_email ? <a href={`mailto:${s.contact_email}`}>{s.contact_email}</a> : "l'adresse indiquée en bas de page";
  return (
    <LegalPage title="Politique de confidentialité" updated="15 octobre 2026">
      <p>
        Cette page explique quelles données Aloa-Mada collecte, pourquoi, qui peut les voir et comment exercer vos droits, conformément à la loi
        malgache n° 2014-038 sur la protection des données à caractère personnel.
      </p>

      <h2>Responsable du traitement</h2>
      <Publisher s={s} />

      <h2>Données collectées</h2>
      <ul>
        <li>Compte : prénom, nom, email, mot de passe (chiffré, jamais lisible par notre équipe).</li>
        <li>Profil : photo, ville, métier, compétences, expérience, langues, contrats recherchés, prétentions, disponibilité, présentation.</li>
        <li>Recruteurs : nom et secteur de la structure, taille, site web, NIF ou STAT s&apos;ils sont fournis.</li>
        <li>Coordonnées : téléphone et WhatsApp, s&apos;ils sont renseignés.</li>
        <li>Activité : messages échangés, candidatures, favoris, alertes, vues de profil (sans le détail des visiteurs).</li>
        <li>Paiements Pro : opérateur, montant et référence de transaction. Aucune donnée bancaire n&apos;est collectée.</li>
      </ul>

      <h2>Qui voit quoi</h2>
      <ul>
        <li>Tout le monde : portrait, prénom et initiale du nom, métier, ville, disponibilité et prétentions.</li>
        <li>Membres connectés : la fiche complète, sauf les coordonnées.</li>
        <li>Recruteurs et candidats Pro : en plus, l&apos;email et le téléphone. Les candidats Simple et les visiteurs ne les voient jamais.</li>
        <li>Les messages sont réservés aux deux personnes de la conversation. L&apos;équipe peut les consulter uniquement pour traiter un signalement.</li>
      </ul>

      <h2>Pourquoi nous utilisons ces données</h2>
      <ul>
        <li>Afficher votre profil et permettre la mise en relation.</li>
        <li>Vérifier les profils et lutter contre les faux comptes et les abus.</li>
        <li>Vous envoyer les emails utiles : nouveau message, candidature reçue, alertes que vous avez créées, activation du Pro.</li>
      </ul>
      <p>Vos données ne sont jamais vendues ni utilisées pour de la publicité.</p>

      <h2>Durée de conservation</h2>
      <p>
        Les données sont conservées tant que votre compte est actif. La suppression d&apos;un compte efface immédiatement le profil, la photo, les messages, les
        offres, les candidatures et l&apos;historique des demandes Pro.
      </p>

      <h2>Hébergement et sécurité</h2>
      <p>
        Les données sont hébergées par Supabase (base de données et photos) et le site est servi par Vercel. Les échanges sont chiffrés (HTTPS) et
        l&apos;accès aux données est limité par des règles appliquées directement dans la base.
      </p>

      <h2>Vos droits</h2>
      <p>
        Vous pouvez à tout moment corriger vos informations depuis votre profil, passer en statut « En poste » pour ne plus être contacté, ou
        supprimer définitivement votre compte en bas de la page « Mon profil ». Pour toute autre demande (accès, copie, rectification),
        écrivez à {contact} : nous répondons sous 30 jours.
      </p>
      <p>
        Vous pouvez également saisir la Commission malagasy de l&apos;informatique et des libertés (CMIL).
      </p>
    </LegalPage>
  );
}
