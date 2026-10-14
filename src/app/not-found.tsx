import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container-page grid min-h-[60vh] place-items-center py-16 text-center">
      <div>
        <h1 className="font-display text-5xl">Page introuvable</h1>
        <p className="mt-3 text-muted">Ce profil ou cette offre n&apos;existe plus.</p>
        <Link href="/" className="btn-primary mt-6">Retour à la galerie</Link>
      </div>
    </main>
  );
}
