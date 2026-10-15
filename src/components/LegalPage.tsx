/** Mise en page commune des pages d'information (CGU, confidentialité). */
export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <main className="container-page py-12 sm:py-16">
      <div className="mx-auto max-w-[720px]">
        <h1 className="page-title">{title}</h1>
        <p className="mt-3 text-sm text-muted">Dernière mise à jour : {updated}</p>
        <div className="mt-10 flex flex-col gap-4 text-[16px] leading-[1.75] [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-[22px] [&_h2]:leading-snug [&_h2]:font-bold [&_li]:pl-1 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:pl-5">
          {children}
        </div>
      </div>
    </main>
  );
}

/** Éditeur et contact tels que renseignés dans /admin › Paramètres. */
export function Publisher({ s }: { s: { publisher_name: string | null; publisher_address: string | null; publisher_ids: string | null; contact_email: string | null; contact_phone: string | null } }) {
  const name = s.publisher_name || "Aloa-Mada";
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-line">
      <p className="font-bold">{name}</p>
      {s.publisher_address && <p>{s.publisher_address}</p>}
      {s.publisher_ids && <p>{s.publisher_ids}</p>}
      {s.contact_email && <p>Email : <a href={`mailto:${s.contact_email}`}>{s.contact_email}</a></p>}
      {s.contact_phone && <p>Téléphone : {s.contact_phone}</p>}
    </div>
  );
}
