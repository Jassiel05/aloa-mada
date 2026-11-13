import { availabilityLabel, contractLabel, displayName, formatRate, publicPhoto, workModeLabel } from "./labels";
import { hasPrice, maskContacts } from "./privacy";
import type { Contacts, ProfileWithDetails } from "./types";

/** Données d'un portrait, prêtes à afficher (sérialisables vers le client). */
export interface Card {
  id: string;
  role: "candidate" | "recruiter" | "admin";
  name: string;
  first: string;
  photo: string | null;
  gender: "homme" | "femme" | null;
  title: string;
  city: string;
  headline: string | null;
  isPro: boolean;
  available: boolean;
  availability: string;
  availabilityLong: string;
  rate: string | null;
  /** Un montant existe mais il est réservé aux membres validés */
  rateHidden: boolean;
  contracts: string[];
  modes: string[];
  experience: string | null;
  languages: string[];
  skills: string[];
  bio: string | null;
  portfolio: string | null;
  hasCv: boolean;
  company: string | null;
  verified: boolean;
  lookingFor: string | null;
  contacts: { email: string | null; phone: string | null; whatsapp: string | null } | null;
}

/** `validated` : membre connecté dont le profil est validé. Sinon : pas de montant, pas d'email ni de téléphone dans les textes. */
export function toCard(p: ProfileWithDetails, contacts?: Contacts, validated = false): Card {
  const c = p.candidate_details;
  const r = p.recruiter_details;
  const isPro = p.plan === "pro" && (!p.plan_expires_at || new Date(p.plan_expires_at) > new Date());
  const available = c ? c.availability !== "employed" : true;
  const company = r?.kind === "company" ? r.company_name : null;
  const priced = !!c && hasPrice(c.rate_amount, c.rate_unit);
  const clean = <T extends string | null | undefined>(t: T) => (validated ? t : maskContacts(t));
  return {
    id: p.id,
    role: p.role,
    name: displayName(p.first_name, p.last_name),
    first: p.first_name?.trim() || "ce membre",
    photo: publicPhoto(p),
    gender: p.gender ?? null,
    title: c?.job_title || (r ? (company ? `Recruteur · ${company}` : "Recruteur particulier") : "Membre"),
    city: p.city ?? "",
    headline: clean(p.headline),
    isPro,
    available,
    availability: c ? availabilityLabel(c.availability, c.available_from) : "Recrute",
    availabilityLong: c ? availabilityLabel(c.availability, c.available_from, true) : "Recrute en ce moment",
    rate: c && !(priced && !validated) ? formatRate(c.rate_amount, c.rate_currency, c.rate_unit) : null,
    rateHidden: priced && !validated,
    contracts: (c?.contract_types ?? []).map(contractLabel),
    modes: (c?.work_modes ?? []).map(workModeLabel),
    experience: c?.experience_years != null ? `${c.experience_years} an${c.experience_years > 1 ? "s" : ""}` : null,
    languages: c?.languages ?? [],
    skills: c?.skills ?? [],
    bio: clean(c?.bio ?? null),
    portfolio: c?.portfolio_url && /^https?:\/\//i.test(c.portfolio_url) ? c.portfolio_url : null,
    hasCv: !!c?.cv_path,
    company,
    verified: r?.verified ?? false,
    lookingFor: clean(r?.looking_for ?? null),
    contacts: contacts ? { email: contacts.email, phone: contacts.phone, whatsapp: contacts.whatsapp } : null,
  };
}
