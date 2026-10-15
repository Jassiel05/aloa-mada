import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container-page grid min-h-[60vh] place-items-center py-16 text-center">
      <div className="max-w-md">
        <p className="font-display text-7xl font-bold text-brand">404</p>
        <h1 className="mt-4 font-display text-3xl font-bold">Cette page n&apos;existe pas ou plus</h1>
        <p className="mt-3 text-muted">Le profil a peut-être été retiré, ou l&apos;offre clôturée.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Link href="/" className="btn-primary">Voir les talents</Link>
          <Link href="/offres" className="btn-outline">Voir les offres</Link>
        </div>
      </div>
    </main>
  );
}
