"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import type { Card } from "@/lib/cards";
import { reportContent, startConversation } from "@/app/actions/contact";
import Portrait from "./Portrait";
import UpgradeModal, { type UpgradeKind } from "./UpgradeModal";
import type { GalleryViewer } from "./Gallery";

export default function ProfileDrawer({ card, viewer, onClose }: { card: Card | null; viewer: GalleryViewer; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [upgrade, setUpgrade] = useState<UpgradeKind | null>(null);
  const [composing, setComposing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [reported, setReported] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (card && !d.open) d.showModal();
    if (!card && d.open) d.close();
    setComposing(false);
    setError(null);
    setReported(false);
    setMessage(card ? `Bonjour ${card.first}, votre profil m'intéresse. Êtes-vous disponible pour en parler ?` : "");
  }, [card]);

  if (!card) return <dialog ref={ref} className="hidden" />;

  const isSelf = viewer?.id === card.id;

  function onContact() {
    if (!viewer) return;
    if (!viewer.canStart) return setUpgrade("contact");
    setComposing(true);
  }

  function onSend() {
    if (!card) return;
    setError(null);
    startTransition(async () => {
      const res = await startConversation(card.id, message);
      if (res?.upgrade) setUpgrade("contact");
      else if (res?.error) setError(res.error);
    });
  }

  function onReport() {
    if (!card) return;
    const reason = window.prompt("Pourquoi signalez-vous ce profil ?");
    if (!reason || reason.trim().length < 3) return;
    startTransition(async () => {
      const res = await reportContent({ profileId: card.id, reason });
      if ("ok" in res) setReported(true);
    });
  }

  return (
    <>
      <dialog
        ref={ref}
        onClose={onClose}
        aria-label={`Fiche de ${card.name}`}
        className="m-0 ml-auto h-dvh max-h-dvh w-full max-w-[480px] overflow-hidden bg-ivory p-0 text-ink backdrop:bg-ink/35"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="flex h-full flex-col overflow-y-auto">
          <div className="relative aspect-[4/5] max-h-[52vh] w-full flex-none">
            <Portrait id={card.id} src={card.photo} alt={`Portrait de ${card.name}`} sizes="480px" />
            <button type="button" onClick={onClose} aria-label="Fermer la fiche" className="absolute top-4 right-4 grid size-11 place-items-center rounded-full bg-white">
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
            {card.isPro && <span className="absolute top-4 left-4 rounded-full bg-laterite px-2.5 py-1 text-[11px] font-bold tracking-wider text-white">PRO</span>}
          </div>

          <div className="flex flex-1 flex-col gap-5 px-6 pt-7 sm:px-8">
            <div>
              <p className="flex items-center gap-2 text-[13px] font-bold">
                <span aria-hidden="true" className={`size-2 rounded-full ${card.available ? "bg-ravinala" : "bg-employed"}`} />
                {card.availabilityLong}
              </p>
              <h2 className="mt-2 mb-1 font-display text-[34px] leading-tight font-semibold tracking-tight">{card.name}</h2>
              <p className="font-semibold text-muted">
                {card.title}
                {card.city ? ` · ${card.city}` : ""}
                {card.verified && <span className="ml-2 rounded-full bg-ravinala-soft px-2 py-0.5 text-xs text-ravinala-ink">Entreprise vérifiée</span>}
              </p>
            </div>

            {card.headline && <p className="text-base leading-relaxed">{card.headline}</p>}

            {!viewer ? (
              <div className="rounded-2xl bg-sand p-5">
                <p className="font-semibold">Créez un compte gratuit pour voir la fiche complète et entrer en contact.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href="/inscription" className="btn-primary">Créer mon profil</Link>
                  <Link href={`/connexion?next=${encodeURIComponent(`/?p=${card.id}`)}`} className="btn-outline">Se connecter</Link>
                </div>
              </div>
            ) : (
              <>
                {card.skills.length > 0 && (
                  <ul className="flex flex-wrap gap-2" aria-label="Compétences">
                    {card.skills.map((s) => <li key={s} className="rounded-full bg-sand px-3 py-1.5 text-[13px] font-semibold">{s}</li>)}
                  </ul>
                )}
                <dl className="grid grid-cols-[130px_1fr] gap-x-4 gap-y-3 border-t border-line pt-5 text-[15px]">
                  {card.rate && (<><dt className="text-muted">Prétention</dt><dd className="font-bold">{card.rate}</dd></>)}
                  {card.contracts.length > 0 && (<><dt className="text-muted">Contrat</dt><dd className="font-semibold">{card.contracts.join(", ")}</dd></>)}
                  {card.modes.length > 0 && (<><dt className="text-muted">Mode</dt><dd className="font-semibold">{card.modes.join(", ")}</dd></>)}
                  {card.experience && (<><dt className="text-muted">Expérience</dt><dd className="font-semibold">{card.experience}</dd></>)}
                  {card.languages.length > 0 && (<><dt className="text-muted">Langues</dt><dd className="font-semibold">{card.languages.join(", ")}</dd></>)}
                  {card.company && (<><dt className="text-muted">Entreprise</dt><dd className="font-semibold">{card.company}</dd></>)}
                  {card.contacts?.phone && (<><dt className="text-muted">Téléphone</dt><dd className="font-semibold"><a href={`tel:${card.contacts.phone}`}>{card.contacts.phone}</a></dd></>)}
                  {card.contacts?.whatsapp && (<><dt className="text-muted">WhatsApp</dt><dd className="font-semibold">{card.contacts.whatsapp}</dd></>)}
                  {card.contacts?.email && (<><dt className="text-muted">Email</dt><dd className="font-semibold break-all"><a href={`mailto:${card.contacts.email}`}>{card.contacts.email}</a></dd></>)}
                </dl>
                {card.bio && <p className="leading-relaxed whitespace-pre-line">{card.bio}</p>}
                {card.lookingFor && (
                  <div>
                    <h3 className="text-sm font-bold text-muted">Recherche</h3>
                    <p className="mt-1 leading-relaxed whitespace-pre-line">{card.lookingFor}</p>
                  </div>
                )}
                {card.portfolio && (
                  <a href={card.portfolio} target="_blank" rel="noopener noreferrer nofollow" className="font-bold">Voir le portfolio ↗</a>
                )}
                {!isSelf && (
                  <button type="button" onClick={onReport} disabled={reported || pending} className="self-start text-sm text-muted underline">
                    {reported ? "Signalement envoyé, merci." : "Signaler ce profil"}
                  </button>
                )}
              </>
            )}
          </div>

          {viewer && !isSelf && (
            <div className="sticky bottom-0 mt-6 border-t border-line bg-ivory px-6 pt-5 pb-7 sm:px-8">
              {!card.available ? (
                <p className="text-center text-sm font-semibold text-muted">Cette personne est en poste et ne reçoit plus de nouveaux contacts.</p>
              ) : composing ? (
                <div className="flex flex-col gap-2.5">
                  <label htmlFor="first-message" className="text-sm font-bold">Votre message à {card.first}</label>
                  <textarea id="first-message" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={4000} className="field min-h-24 py-3" />
                  {error && <p role="alert" className="text-sm font-semibold text-laterite-dark">{error}</p>}
                  <button type="button" onClick={onSend} disabled={pending} className="btn-primary min-h-12 text-base">
                    {pending ? "Envoi…" : "Envoyer"}
                  </button>
                </div>
              ) : (
                <button type="button" onClick={onContact} className="btn-primary min-h-13 w-full text-base">Contacter {card.first}</button>
              )}
            </div>
          )}
        </div>
      </dialog>
      <UpgradeModal kind={upgrade} onClose={() => setUpgrade(null)} />
    </>
  );
}
