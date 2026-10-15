import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/pricing";
import LegalPage, { Publisher } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation",
  alternates: { canonical: "/cgu" },
};

export default async function CguPage() {
  const s = await getSettings();
  const contact = s.contact_email ? <a href={`mailto:${s.contact_email}`}>{s.contact_email}</a> : "l'adresse indiquée en bas de page";
  return (
    <LegalPage title="Conditions générales d'utilisation" updated="15 octobre 2026">
      <p>
        Les présentes conditions encadrent l&apos;utilisation du site Aloa-Mada. En créant un compte, vous les acceptez sans réserve.
      </p>

      <h2>1. Éditeur du site</h2>
      <Publisher s={s} />

      <h2>2. Le service</h2>
      <p>
        Aloa-Mada est une plateforme de mise en relation entre des personnes qui cherchent un emploi ou une mission (les « candidats ») et des
        entreprises ou particuliers qui recrutent (les « recruteurs »), à Madagascar. Aloa-Mada n&apos;est ni employeur, ni agence de placement, ni
        partie aux contrats conclus entre les membres.
      </p>

      <h2>3. Inscription et profil</h2>
      <ul>
        <li>L&apos;inscription est gratuite et réservée aux personnes majeures.</li>
        <li>Chaque membre fournit des informations exactes et à jour, et une photo portrait récente sur laquelle son visage est net.</li>
        <li>Chaque profil est vérifié avant d&apos;être publié. Un profil peut être refusé, masqué ou suspendu s&apos;il ne respecte pas ces conditions.</li>
        <li>Vous êtes responsable de la confidentialité de votre mot de passe et de toute activité réalisée depuis votre compte.</li>
      </ul>

      <h2>4. Comptes Simple et Pro</h2>
      <p>
        Le compte Simple est gratuit. Le compte Pro donne accès à des fonctions supplémentaires décrites sur la page{" "}
        <Link href="/pro">Tarifs</Link>. Il est payé d&apos;avance par Mobile Money, pour une durée choisie par le membre, et n&apos;est pas reconduit
        automatiquement. Il est activé après vérification du paiement. Une période entamée n&apos;est pas remboursable, sauf erreur de notre part
        ou impossibilité d&apos;activer le service.
      </p>

      <h2>5. Règles de conduite</h2>
      <p>Il est interdit de :</p>
      <ul>
        <li>créer un faux profil ou se faire passer pour une autre personne ou entreprise ;</li>
        <li>demander de l&apos;argent à un candidat en échange d&apos;un emploi, d&apos;une formation ou d&apos;un entretien ;</li>
        <li>publier une offre illégale, trompeuse ou discriminatoire ;</li>
        <li>harceler, insulter ou menacer un autre membre ;</li>
        <li>copier ou collecter de façon automatisée les profils et coordonnées des membres.</li>
      </ul>
      <p>
        Chaque fiche comporte un lien « Signaler ». Les signalements sont examinés par notre équipe, qui peut suspendre un compte sans préavis en cas
        de manquement grave.
      </p>

      <h2>6. Responsabilité</h2>
      <p>
        Aloa-Mada vérifie les photos et les informations visibles des profils, mais ne peut garantir l&apos;exactitude de tout ce que les membres
        déclarent. Il appartient à chacun de vérifier les références, diplômes et conditions proposées avant de s&apos;engager. Aloa-Mada ne peut être
        tenue responsable des relations, contrats ou litiges entre membres.
      </p>

      <h2>7. Suppression du compte</h2>
      <p>
        Vous pouvez supprimer votre compte à tout moment depuis la page « Mon profil », ou en écrivant à {contact}. Votre profil est alors retiré
        de la galerie et vos données sont effacées comme décrit dans la <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>

      <h2>8. Modification des conditions</h2>
      <p>
        Ces conditions peuvent évoluer. La date de mise à jour figure en haut de cette page ; les changements importants sont annoncés par email.
      </p>

      <h2>9. Droit applicable</h2>
      <p>Les présentes conditions sont soumises au droit malgache. À défaut d&apos;accord amiable, les tribunaux d&apos;Antananarivo sont compétents.</p>
    </LegalPage>
  );
}
