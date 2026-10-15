"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** Menu du téléphone : se referme tout seul après chaque navigation. */
export default function MobileMenu({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [pathname]);

  return (
    <details ref={ref} className="group xl:hidden">
      <summary
        aria-label="Ouvrir le menu"
        className="grid size-11 cursor-pointer list-none place-items-center rounded-xl border border-line bg-white text-ink [&::-webkit-details-marker]:hidden"
      >
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path className="group-open:hidden" d="M4 7h16M4 12h16M4 17h16" />
          <path className="hidden group-open:block" d="M6 6l12 12M18 6L6 18" />
        </svg>
      </summary>
      <div className="absolute inset-x-0 top-full z-40 border-b border-line bg-white shadow-lift">
        <div className="container-page flex flex-col gap-1 py-4">{children}</div>
      </div>
    </details>
  );
}
