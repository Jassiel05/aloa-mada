import Link from "next/link";
import { getSettings } from "@/lib/pricing";
import { getViewer } from "@/lib/viewer";
import Logo from "./Logo";

const columns = (loggedIn: boolean) => [
  {
    title: "Plateforme",
    links: [
      { href: "/", label: "Talents" },
      { href: "/?vue=recruteurs", label: "Recruteurs" },
      { href: "/offres", label: "Offres d'emploi" },
      { href: "/pro", label: "Tarifs" },
    ],
  },
  {
    title: "Votre compte",
    links: loggedIn
      ? [
          { href: "/profil", label: "Mon profil" },
          { href: "/messages", label: "Messages" },
          { href: "/favoris", label: "Favoris" },
          { href: "/alertes", label: "Alertes email" },
        ]
      : [
          { href: "/inscription", label: "Créer mon profil" },
          { href: "/connexion", label: "Se connecter" },
        ],
  },
  {
    title: "Informations",
    links: [
      { href: "/cgu", label: "Conditions d'utilisation" },
      { href: "/confidentialite", label: "Confidentialité" },
    ],
  },
];

export default async function Footer() {
  const [s, viewer] = await Promise.all([getSettings(), getViewer()]);
  return (
    <footer className="mt-20 bg-forest text-white/75">
      <div className="container-page grid grid-cols-2 gap-x-6 gap-y-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="col-span-2 max-w-xs md:col-span-1">
          <Logo tone="light" />
          <p className="mt-4 text-sm leading-relaxed">
            La plateforme de recrutement direct à Madagascar. Des profils avec photo, vérifiés un par un, et un contact en deux clics.
          </p>
          {(s.contact_email || s.contact_phone) && (
            <p className="mt-4 flex flex-col gap-1 text-sm">
              {s.contact_email && <a href={`mailto:${s.contact_email}`} className="font-semibold text-white">{s.contact_email}</a>}
              {s.contact_phone && <a href={`tel:${s.contact_phone.replace(/\s/g, "")}`} className="font-semibold text-white">{s.contact_phone}</a>}
            </p>
          )}
        </div>
        {columns(Boolean(viewer)).map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h2 className="text-sm font-bold text-white">{c.title}</h2>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm">
              {c.links.map((l) => (
                <li key={l.href}><Link href={l.href} className="text-white/75 hover:text-white">{l.label}</Link></li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-wrap items-center justify-between gap-2 py-5 text-xs text-white/55">
          <p>© {new Date().getFullYear()} {s.publisher_name || "Aloa-Mada"}. Tous droits réservés.</p>
          <p>Fait à Madagascar</p>
        </div>
      </div>
    </footer>
  );
}
