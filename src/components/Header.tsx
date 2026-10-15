import Link from "next/link";
import { getViewer } from "@/lib/viewer";
import { signOut } from "@/app/actions/auth";
import Logo from "./Logo";
import MobileMenu from "./MobileMenu";

type NavItem = { href: string; label: string };

export default async function Header() {
  const viewer = await getViewer();
  const isRecruiter = viewer?.profile.role === "recruiter";
  const isCandidate = viewer?.profile.role === "candidate";

  const main: NavItem[] = [
    { href: "/", label: "Talents" },
    { href: "/?vue=recruteurs", label: "Recruteurs" },
    { href: "/offres", label: "Offres d'emploi" },
    { href: "/pro", label: "Tarifs" },
  ];
  const account: NavItem[] = viewer
    ? [
        { href: "/messages", label: "Messages" },
        ...(isRecruiter ? [{ href: "/mes-offres", label: "Mes offres" }] : []),
        ...(isCandidate ? [{ href: "/candidatures", label: "Mes candidatures" }] : []),
        { href: "/favoris", label: "Favoris" },
        { href: "/alertes", label: "Alertes" },
        ...(viewer.isAdmin ? [{ href: "/admin", label: "Back-office" }] : []),
      ]
    : [];

  const linkCls = "rounded-lg px-3 py-2 text-[15px] font-semibold whitespace-nowrap text-ink no-underline hover:bg-subtle hover:no-underline";

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur-md">
      <div aria-hidden="true" className="brand-gradient h-[3px]" />
      <div className="container-page relative flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav aria-label="Navigation principale" className="hidden items-center gap-1 xl:flex">
          {main.map((l) => <Link key={l.href} href={l.href} className={linkCls}>{l.label}</Link>)}
          {account.slice(0, 2).map((l) => <Link key={l.href} href={l.href} className={linkCls}>{l.label}</Link>)}
          {viewer?.isAdmin && <Link href="/admin" className={`${linkCls} text-brand-dark`}>Back-office</Link>}
        </nav>

        <div className="flex items-center gap-2">
          {viewer ? (
            <>
              {isRecruiter && <Link href="/offres/nouvelle" className="btn-outline hidden 2xl:inline-flex">Publier une offre</Link>}
              <Link href="/profil" className="btn-primary hidden sm:inline-flex">Mon profil</Link>
              <form action={signOut} className="hidden xl:block">
                <button type="submit" className="btn-ghost">Déconnexion</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/connexion" className="btn-ghost hidden sm:inline-flex">Se connecter</Link>
              <Link href="/inscription" className="btn-primary px-4">Créer mon profil</Link>
            </>
          )}
          <MobileMenu>
            {main.map((l) => <Link key={l.href} href={l.href} className={`${linkCls} py-3`}>{l.label}</Link>)}
            {viewer && <hr className="my-2 border-line" />}
            {viewer && <Link href="/profil" className={`${linkCls} py-3`}>Mon profil</Link>}
            {isRecruiter && <Link href="/offres/nouvelle" className={`${linkCls} py-3`}>Publier une offre</Link>}
            {account.map((l) => <Link key={l.href} href={l.href} className={`${linkCls} py-3`}>{l.label}</Link>)}
            <hr className="my-2 border-line" />
            {viewer ? (
              <form action={signOut}>
                <button type="submit" className={`${linkCls} w-full py-3 text-left text-muted`}>Déconnexion</button>
              </form>
            ) : (
              <Link href="/connexion" className={`${linkCls} py-3`}>Se connecter</Link>
            )}
          </MobileMenu>
        </div>
      </div>
    </header>
  );
}
