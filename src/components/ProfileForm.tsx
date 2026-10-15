"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveProfile, type ProfileInput } from "@/app/actions/profile";
import { CITIES, CONTRACTS, LANGUAGES, RATE_UNITS, WORK_MODES } from "@/lib/labels";
import PhotoUpload from "./PhotoUpload";

type Props = {
  userId: string;
  role: "candidate" | "recruiter";
  initial: ProfileInput;
  mode: "onboarding" | "edit";
};

const STEPS = ["Vous", "Votre métier", "Vos conditions"];
const RECRUITER_STEPS = ["Vous", "Votre structure"];

function toggle(list: string[], v: string) {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

export default function ProfileForm({ userId, role, initial, mode }: Props) {
  const router = useRouter();
  const steps = role === "candidate" ? STEPS : RECRUITER_STEPS;
  const [step, setStep] = useState(0);
  const [v, setV] = useState<ProfileInput>(initial);
  const [skillsText, setSkillsText] = useState(initial.candidate?.skills.join(", ") ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const c = v.candidate!;
  const r = v.recruiter!;
  const setC = (patch: Partial<NonNullable<ProfileInput["candidate"]>>) => setV({ ...v, candidate: { ...c, ...patch } });
  const setR = (patch: Partial<NonNullable<ProfileInput["recruiter"]>>) => setV({ ...v, recruiter: { ...r, ...patch } });

  const last = step === steps.length - 1;

  function submit(final: boolean) {
    setError(null);
    setSaved(false);
    const payload: ProfileInput = {
      ...v,
      candidate: role === "candidate" ? { ...c, skills: skillsText.split(",") } : undefined,
      recruiter: role === "recruiter" ? r : undefined,
    };
    start(async () => {
      const res = await saveProfile(payload, final);
      if (res.error) return setError(res.error);
      if (final && mode === "onboarding") router.push("/profil?bienvenue=1");
      else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <div>
      <ol className="mb-8 flex gap-2" aria-label="Étapes">
        {steps.map((s, i) => (
          <li key={s} className="flex-1">
            <button
              type="button"
              onClick={() => setStep(i)}
              aria-current={i === step ? "step" : undefined}
              className={`w-full border-t-4 pt-2 text-left text-sm font-bold ${i <= step ? "border-brand text-ink" : "border-line text-muted"}`}
            >
              {i + 1}. {s}
            </button>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="flex flex-col gap-6">
          <PhotoUpload userId={userId} value={v.photo_path} onChange={(photo_path) => setV({ ...v, photo_path })} />
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="first_name" className="label">Prénom *</label>
              <input id="first_name" className="field" value={v.first_name} onChange={(e) => setV({ ...v, first_name: e.target.value })} />
            </div>
            <div>
              <label htmlFor="last_name" className="label">Nom (seule l&apos;initiale est affichée)</label>
              <input id="last_name" className="field" value={v.last_name} onChange={(e) => setV({ ...v, last_name: e.target.value })} />
            </div>
            <div>
              <label htmlFor="city" className="label">Ville *</label>
              <select id="city" className="field" value={v.city} onChange={(e) => setV({ ...v, city: e.target.value })}>
                <option value="">Choisir…</option>
                {CITIES.map((x) => <option key={x}>{x}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="phone" className="label">Téléphone</label>
              <input id="phone" type="tel" className="field" placeholder="034 00 000 00" value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} />
            </div>
            <div>
              <label htmlFor="whatsapp" className="label">WhatsApp (facultatif)</label>
              <input id="whatsapp" type="tel" className="field" value={v.whatsapp} onChange={(e) => setV({ ...v, whatsapp: e.target.value })} />
            </div>
          </div>
          <div>
            <label htmlFor="headline" className="label">Phrase d&apos;accroche ({v.headline.length}/160)</label>
            <input id="headline" maxLength={160} className="field" placeholder={role === "candidate" ? "Électricien soigneux, devis clair avant chaque chantier." : "PME de services à Tana, nous recrutons régulièrement."} value={v.headline} onChange={(e) => setV({ ...v, headline: e.target.value })} />
          </div>
          <p className="text-sm text-muted">Votre téléphone et votre email ne sont visibles que par les recruteurs et les membres Pro.</p>
        </div>
      )}

      {role === "candidate" && step === 1 && (
        <div className="flex flex-col gap-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="job" className="label">Métier principal *</label>
              <input id="job" className="field" placeholder="ex. Électricien, Comptable, Graphiste" value={c.job_title} onChange={(e) => setC({ job_title: e.target.value })} />
            </div>
            <div>
              <label htmlFor="xp" className="label">Années d&apos;expérience</label>
              <input id="xp" type="number" min={0} max={60} className="field" value={c.experience_years ?? ""} onChange={(e) => setC({ experience_years: e.target.value === "" ? null : Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label htmlFor="skills" className="label">Compétences (séparées par des virgules, 3 à 8)</label>
            <input id="skills" className="field" placeholder="Installation, Dépannage, Mise aux normes" value={skillsText} onChange={(e) => setSkillsText(e.target.value)} />
          </div>
          <fieldset>
            <legend className="label">Langues</legend>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((l) => (
                <label key={l} className="chip">
                  <input type="checkbox" className="sr-only" checked={c.languages.includes(l)} onChange={() => setC({ languages: toggle(c.languages, l) })} />
                  {l}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="label">Mode de travail</legend>
            <div className="flex flex-wrap gap-2">
              {WORK_MODES.map((m) => (
                <label key={m.value} className="chip">
                  <input type="checkbox" className="sr-only" checked={c.work_modes.includes(m.value)} onChange={() => setC({ work_modes: toggle(c.work_modes, m.value) })} />
                  {m.label}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="bio" className="label">Présentation (facultatif)</label>
            <textarea id="bio" rows={4} maxLength={1200} className="field py-3" value={c.bio} onChange={(e) => setC({ bio: e.target.value })} />
          </div>
        </div>
      )}

      {role === "candidate" && step === 2 && (
        <div className="flex flex-col gap-6">
          <fieldset>
            <legend className="label">Collaboration recherchée *</legend>
            <div className="flex flex-wrap gap-2">
              {CONTRACTS.map((ct) => (
                <label key={ct.value} className="chip">
                  <input type="checkbox" className="sr-only" checked={c.contract_types.includes(ct.value)} onChange={() => setC({ contract_types: toggle(c.contract_types, ct.value) })} />
                  {ct.label}
                </label>
              ))}
            </div>
          </fieldset>

          {(c.contract_types.includes("cdi") || c.contract_types.includes("cdd")) && (
            <div>
              <label htmlFor="notice" className="label">Préavis</label>
              <input id="notice" className="field" placeholder="ex. 1 mois, immédiat" value={c.notice_period} onChange={(e) => setC({ notice_period: e.target.value })} />
            </div>
          )}
          {c.contract_types.includes("freelance") && (
            <div>
              <label htmlFor="portfolio" className="label">Lien portfolio</label>
              <input id="portfolio" type="url" className="field" placeholder="https://" value={c.portfolio_url} onChange={(e) => setC({ portfolio_url: e.target.value })} />
            </div>
          )}
          {c.contract_types.includes("internship") && (
            <div>
              <label htmlFor="school" className="label">École et niveau d&apos;études</label>
              <input id="school" className="field" value={c.school} onChange={(e) => setC({ school: e.target.value })} />
            </div>
          )}

          <fieldset>
            <legend className="label">Prétention</legend>
            <div className="grid gap-3 sm:grid-cols-[1fr_120px_180px]">
              <label className="sr-only" htmlFor="amount">Montant</label>
              <input id="amount" type="number" min={0} step={1000} disabled={c.rate_unit === "negotiable"} className="field" placeholder="Montant" value={c.rate_amount ?? ""} onChange={(e) => setC({ rate_amount: e.target.value === "" ? null : Number(e.target.value) })} />
              <label className="sr-only" htmlFor="currency">Devise</label>
              <select id="currency" className="field" disabled={c.rate_unit === "negotiable"} value={c.rate_currency} onChange={(e) => setC({ rate_currency: e.target.value as "MGA" | "EUR" })}>
                <option value="MGA">Ariary</option>
                <option value="EUR">Euro</option>
              </select>
              <label className="sr-only" htmlFor="unit">Unité</label>
              <select id="unit" className="field" value={c.rate_unit} onChange={(e) => setC({ rate_unit: e.target.value as typeof c.rate_unit })}>
                {RATE_UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>
          </fieldset>

          <fieldset>
            <legend className="label">Disponibilité</legend>
            <div className="flex flex-wrap gap-2">
              {([
                ["available", "Disponible maintenant"],
                ["available_from", "À partir d'une date"],
                ["employed", "En poste"],
              ] as const).map(([val, label]) => (
                <label key={val} className="chip">
                  <input type="radio" name="availability" className="sr-only" checked={c.availability === val} onChange={() => setC({ availability: val })} />
                  {label}
                </label>
              ))}
            </div>
            {c.availability === "available_from" && (
              <div className="mt-3 max-w-xs">
                <label htmlFor="from" className="label">Disponible le</label>
                <input id="from" type="date" className="field" value={c.available_from ?? ""} onChange={(e) => setC({ available_from: e.target.value })} />
              </div>
            )}
          </fieldset>
        </div>
      )}

      {role === "recruiter" && step === 1 && (
        <div className="flex flex-col gap-6">
          <fieldset>
            <legend className="label">Vous recrutez en tant que</legend>
            <div className="flex flex-wrap gap-2">
              <label className="chip"><input type="radio" name="kind" className="sr-only" checked={r.kind === "individual"} onChange={() => setR({ kind: "individual" })} />Particulier</label>
              <label className="chip"><input type="radio" name="kind" className="sr-only" checked={r.kind === "company"} onChange={() => setR({ kind: "company" })} />Entreprise</label>
            </div>
          </fieldset>
          {r.kind === "company" && (
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="company" className="label">Nom de l&apos;entreprise</label>
                <input id="company" className="field" value={r.company_name} onChange={(e) => setR({ company_name: e.target.value })} />
              </div>
              <div>
                <label htmlFor="sector" className="label">Secteur</label>
                <input id="sector" className="field" value={r.sector} onChange={(e) => setR({ sector: e.target.value })} />
              </div>
              <div>
                <label htmlFor="size" className="label">Taille</label>
                <select id="size" className="field" value={r.company_size} onChange={(e) => setR({ company_size: e.target.value })}>
                  <option value="">Choisir…</option>
                  {["1-5", "6-20", "21-100", "100+"].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="website" className="label">Site web</label>
                <input id="website" type="url" className="field" placeholder="https://" value={r.website} onChange={(e) => setR({ website: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="nif" className="label">NIF / STAT (facultatif, pour le badge « Entreprise vérifiée »)</label>
                <input id="nif" className="field" value={r.nif_stat} onChange={(e) => setR({ nif_stat: e.target.value })} />
              </div>
            </div>
          )}
          <div>
            <label htmlFor="looking" className="label">Qui cherchez-vous ?</label>
            <textarea id="looking" rows={4} maxLength={600} className="field py-3" placeholder="ex. Une aide-ménagère 3 jours par semaine à Ivandry, un électricien pour un chantier…" value={r.looking_for} onChange={(e) => setR({ looking_for: e.target.value })} />
          </div>
        </div>
      )}

      {error && <p role="alert" className="mt-6 rounded-xl bg-danger-soft p-4 text-sm font-semibold text-danger">{error}</p>}
      {saved && <p role="status" className="mt-6 rounded-xl bg-brand-soft p-4 text-sm font-semibold text-brand-ink">Modifications enregistrées.</p>}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
        <button type="button" onClick={() => setStep(step - 1)} disabled={step === 0} className="btn-ghost">← Retour</button>
        <div className="flex gap-2">
          {mode === "edit" && (
            <button type="button" onClick={() => submit(true)} disabled={pending} className="btn-primary">
              {pending ? "Enregistrement…" : "Enregistrer"}
            </button>
          )}
          {!last && (
            <button type="button" onClick={() => setStep(step + 1)} className={mode === "edit" ? "btn-outline" : "btn-primary"}>Continuer →</button>
          )}
          {last && mode === "onboarding" && (
            <button type="button" onClick={() => submit(true)} disabled={pending} className="btn-primary">
              {pending ? "Envoi…" : "Envoyer mon profil pour validation"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
