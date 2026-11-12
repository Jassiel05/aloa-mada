import Link from "next/link";

/** Information réservée aux membres connectés dont le profil est validé (salaire, coordonnées du site…). */
export default function LockedInfo({ children = "Réservé aux membres validés", loggedIn = false, className = "" }: { children?: React.ReactNode; loggedIn?: boolean; className?: string }) {
  return (
    <span className={`inline-flex flex-wrap items-center gap-x-1.5 text-muted ${className}`}>
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </svg>
      <span>{children}</span>
      {!loggedIn && (
        <Link href="/connexion" className="font-semibold">Se connecter</Link>
      )}
    </span>
  );
}
