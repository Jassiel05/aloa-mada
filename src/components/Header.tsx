import Link from "next/link";
import { getViewer } from "@/lib/viewer";
import { signOut } from "@/app/actions/auth";
import Logo from "./Logo";

export default async function Header() {
  const viewer = await getViewer();
  const isRecruiter = viewer?.profile.role === "recruiter";
  const isCandidate = viewer?.profile.role === "candidate";

  return (
    <header className="border-b border-line">
      <div className="container-page flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4">
        <Logo />
        <nav aria-label="Navigation principale" className="order-3 flex w-full gap-6 overflow-x-auto text-[15px] font-semibold md:order-none md:w-auto">
          <Link href="/" className="whitespace-nowrap py-2 text-ink hover:text-laterite">Talents</Link>
          <Link href="/?vue=recruteurs" className="whitespace-nowrap py-2 text-muted hover:text-laterite">Recruteurs</Link>
          <Link href="/offres" className="whitespace-nowrap py-2 text-muted hover:text-laterite">Offres</Link>
          <Link href="/pro" className="whitespace-nowrap py-2 text-muted hover:text-laterite">Tarifs</Link>
          {viewer && (
            <Link href="/messages" className="whitespace-nowrap py-2 text-muted hover:text-laterite">Messages</Link>
          )}
          {isRecruiter && (
            <Link href="/mes-offres" className="whitespace-nowrap py-2 text-muted hover:text-laterite">Mes offres</Link>
          )}
          {isCandidate && (
            <Link href="/candidatures" className="whitespace-nowrap py-2 text-muted hover:text-laterite">Candidatures</Link>
          )}
          {viewer?.isAdmin && (
            <Link href="/admin" className="whitespace-nowrap py-2 font-bold text-laterite">Admin</Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {viewer ? (
            <>
              {isRecruiter && <Link href="/offres/nouvelle" className="btn-outline hidden sm:inline-flex">Publier une offre</Link>}
              <Link href="/profil" className="btn-primary">Mon profil</Link>
              <form action={signOut}>
                <button type="submit" className="btn-ghost">Déconnexion</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/connexion" className="btn-ghost no-underline">Se connecter</Link>
              <Link href="/inscription" className="btn-primary">Créer mon profil</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
