import Link from "next/link";

/** Marque : un ravinala (arbre du voyageur) stylisé, en éventail. */
export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="9" fill="currentColor" />
      <g stroke="#fff" strokeWidth="2.2" strokeLinecap="round" fill="none">
        <path d="M16 25V14" />
        <path d="M16 15 9 8.5" />
        <path d="M16 15l7-6.5" />
        <path d="M16 14.5 12.2 6.6" />
        <path d="M16 14.5l3.8-7.9" />
      </g>
      <circle cx="16" cy="25.2" r="1.6" fill="#f5b82e" />
    </svg>
  );
}

export default function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <Link
      href="/"
      aria-label="Aloa-Mada, accueil"
      className={`inline-flex items-center gap-2.5 no-underline hover:no-underline ${tone === "light" ? "text-white" : "text-forest"}`}
    >
      <LogoMark className={`size-8 ${tone === "light" ? "text-brand" : "text-brand"}`} />
      <span className="font-display text-[20px] leading-none font-bold whitespace-nowrap sm:text-[22px]">aloa-mada</span>
    </Link>
  );
}
