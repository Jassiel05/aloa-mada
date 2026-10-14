import type { Availability, RateUnit } from "./types";

export const CONTRACTS: { value: string; label: string }[] = [
  { value: "cdi", label: "CDI" },
  { value: "cdd", label: "CDD" },
  { value: "freelance", label: "Freelance / mission" },
  { value: "part_time", label: "Temps partiel" },
  { value: "internship", label: "Stage" },
  { value: "daily", label: "Journalier / extra" },
];

export const WORK_MODES: { value: string; label: string }[] = [
  { value: "onsite", label: "Sur site" },
  { value: "remote", label: "Télétravail" },
  { value: "hybrid", label: "Hybride" },
];

export const RATE_UNITS: { value: RateUnit; label: string }[] = [
  { value: "hour", label: "par heure" },
  { value: "day", label: "par jour" },
  { value: "month", label: "par mois" },
  { value: "project", label: "par projet" },
  { value: "negotiable", label: "À négocier" },
];

export const LANGUAGES = ["Malagasy", "Français", "Anglais", "Chinois", "Italien", "Allemand"];

export const CITIES = [
  "Antananarivo",
  "Toamasina",
  "Antsirabe",
  "Mahajanga",
  "Fianarantsoa",
  "Toliara",
  "Antsiranana",
  "Nosy Be",
  "Morondava",
  "Fort-Dauphin",
];

const UNIT_SHORT: Record<RateUnit, string> = {
  hour: "heure",
  day: "jour",
  month: "mois",
  project: "projet",
  negotiable: "",
};

export function contractLabel(v: string) {
  return CONTRACTS.find((c) => c.value === v)?.label ?? v;
}

export function workModeLabel(v: string) {
  return WORK_MODES.find((c) => c.value === v)?.label ?? v;
}

export function formatRate(amount: number | null, currency: "MGA" | "EUR", unit: RateUnit) {
  if (unit === "negotiable" || amount == null) return "À négocier";
  const n = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount);
  return `${n} ${currency === "EUR" ? "€" : "Ar"} / ${UNIT_SHORT[unit]}`;
}

export function availabilityLabel(a: Availability, from?: string | null, long = false) {
  if (a === "employed") return long ? "En poste — ne prend plus de nouveaux contacts" : "En poste";
  if (a === "available_from" && from) {
    const d = new Date(from).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
    return `Disponible le ${d}`;
  }
  return long ? "Disponible maintenant" : "Disponible";
}

export function displayName(first: string | null, last: string | null) {
  const f = first?.trim() || "Membre";
  const l = last?.trim();
  return l ? `${f} ${l.charAt(0).toUpperCase()}.` : f;
}

export function photoUrl(path: string | null) {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}`;
}

export const ERROR_MESSAGES: Record<string, string> = {
  upgrade_required: "Cette action est réservée aux comptes Pro.",
  profile_unavailable: "Ce profil n'est plus disponible.",
  profile_employed: "Cette personne est en poste et ne reçoit plus de nouveaux contacts.",
  daily_limit: "Limite de 30 nouveaux contacts par jour atteinte. Réessayez demain.",
  self_contact: "Vous ne pouvez pas vous écrire à vous-même.",
};

export function friendlyError(message: string | undefined) {
  if (!message) return "Une erreur est survenue.";
  const key = Object.keys(ERROR_MESSAGES).find((k) => message.includes(k));
  return key ? ERROR_MESSAGES[key] : message;
}
