import { formatRate } from "./labels";

/**
 * Ce qui reste caché au public (visiteurs et membres non validés) :
 * un montant (salaire, prétention), l'email, le téléphone et le WhatsApp.
 * Tout le reste s'affiche. « À négocier » n'est pas un montant : il reste visible.
 */

type RateUnit = Parameters<typeof formatRate>[2];
type Currency = Parameters<typeof formatRate>[1];

export const MASKED_CONTACT = "[coordonnées masquées]";

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
// 8 chiffres ou plus, avec espaces, points, tirets ou parenthèses (ex. 034 88 905 46, +261 34 88 905 46)
const PHONE_RE = /(?:\+|00)?\d(?:[\s.\-()]?\d){7,}/g;

/** Retire les emails et numéros de téléphone écrits dans un texte libre (présentation, description…). */
export function maskContacts<T extends string | null | undefined>(text: T): T {
  if (!text) return text;
  return text.replace(EMAIL_RE, MASKED_CONTACT).replace(PHONE_RE, MASKED_CONTACT) as T;
}

/** Vrai si un montant est indiqué (donc à cacher au public). « À négocier » n'est pas un montant. */
export const hasPrice = (amount: number | null, unit: RateUnit) => amount != null && unit !== "negotiable";

/** Texte de rémunération à afficher selon le visiteur ; `hidden` : un montant existe mais il est réservé. */
export function rateText(amount: number | null, currency: Currency, unit: RateUnit, validated: boolean): { text: string | null; hidden: boolean } {
  if (hasPrice(amount, unit) && !validated) return { text: null, hidden: true };
  return { text: formatRate(amount, currency, unit), hidden: false };
}
