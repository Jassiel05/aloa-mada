import { LogoImage } from "./Logo";

/** Mise en page des écrans de connexion et d'inscription : formulaire à gauche, rappel des engagements à droite. */
export default function AuthShell({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <main className="container-page grid gap-10 py-10 sm:py-16 lg:grid-cols-[1fr_440px] lg:items-start lg:gap-16">
      <div className="mx-auto w-full max-w-lg lg:mx-0">
        <h1 className="page-title">{title}</h1>
        <p className="mt-3 text-[17px] text-muted">{intro}</p>
        {children}
      </div>
      <aside className="relative hidden overflow-hidden rounded-3xl bg-night p-10 text-white lg:block">
        <div aria-hidden="true" className="absolute -right-24 -bottom-24 size-72 rounded-full bg-aloa-purple/40 blur-3xl" />
        <div aria-hidden="true" className="absolute -top-20 -left-20 size-56 rounded-full bg-aloa-cyan/20 blur-3xl" />
        <LogoImage className="relative h-12 w-auto" />
        <p className="relative mt-8 font-display text-[28px] leading-tight font-bold">Le recrutement direct, avec un visage sur chaque profil.</p>
        <ul className="relative mt-8 flex flex-col gap-4 text-white/85">
          {[
            "Chaque photo est vérifiée avant publication",
            "Votre téléphone et votre email ne sont jamais publics",
            "Vous indiquez vous-même si vous êtes disponible",
            "Inscription gratuite, Pro sans engagement",
          ].map((t) => (
            <li key={t} className="flex gap-3">
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fd9134" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-none"><path d="M5 12l5 5L20 7" /></svg>
              {t}
            </li>
          ))}
        </ul>
      </aside>
    </main>
  );
}
