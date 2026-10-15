import Link from "next/link";

/** Logo officiel aloa (vectoriel, fond transparent : lisible sur clair comme sur sombre). */
export function LogoImage({ className = "h-8 w-auto" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/brand/aloa-logo.svg" alt="aloa" width={708} height={240} className={className} />;
}

export default function Logo({ className = "h-8 w-auto sm:h-9" }: { className?: string }) {
  return (
    <Link href="/" aria-label="Aloa-Mada, accueil" className="inline-flex shrink-0 items-center no-underline hover:no-underline">
      <LogoImage className={className} />
    </Link>
  );
}
