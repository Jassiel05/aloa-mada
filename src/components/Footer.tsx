import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="container-page flex flex-wrap items-center justify-between gap-4 py-8 text-sm text-muted">
        <Logo size="text-xl" />
        <nav aria-label="Liens légaux" className="flex flex-wrap gap-6">
          <Link href="/cgu" className="text-muted hover:text-ink">CGU</Link>
          <Link href="/confidentialite" className="text-muted hover:text-ink">Confidentialité</Link>
          <Link href="/pro" className="text-muted hover:text-ink">Tarifs</Link>
        </nav>
      </div>
    </footer>
  );
}
