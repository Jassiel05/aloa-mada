import { cache } from "react";
import { createClient } from "./supabase/server";

/**
 * Prix des abonnements Pro, numéros Mobile Money de réception, éditeur et contact du site.
 * Ils se règlent dans /admin › Paramètres (table app_settings) : rien à modifier dans le code.
 */

export type Operator = "mvola" | "orange" | "airtel";

export const OPERATORS: { operator: Operator; label: string }[] = [
  { operator: "mvola", label: "MVola" },
  { operator: "orange", label: "Orange Money" },
  { operator: "airtel", label: "Airtel Money" },
];

export interface AppSettings {
  candidate_price: number | null;
  recruiter_price: number | null;
  payee_name: string | null;
  mvola_number: string | null;
  orange_number: string | null;
  airtel_number: string | null;
  publisher_name: string | null;
  publisher_address: string | null;
  publisher_ids: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}

const EMPTY: AppSettings = {
  candidate_price: null,
  recruiter_price: null,
  payee_name: null,
  mvola_number: null,
  orange_number: null,
  airtel_number: null,
  publisher_name: null,
  publisher_address: null,
  publisher_ids: null,
  contact_email: null,
  contact_phone: null,
};

export const getSettings = cache(async (): Promise<AppSettings> => {
  const supabase = await createClient();
  const { data } = await supabase.from("app_settings").select("*").eq("id", true).maybeSingle();
  return { ...EMPTY, ...(data ?? {}) };
});

/** Numéros renseignés au back-office, dans l'ordre MVola, Orange Money, Airtel Money. */
export function paymentNumbers(s: AppSettings) {
  const numbers: Record<Operator, string | null> = { mvola: s.mvola_number, orange: s.orange_number, airtel: s.airtel_number };
  return OPERATORS.map((o) => ({ ...o, number: numbers[o.operator] })).filter((o) => o.number);
}

export function priceLabel(amount: number | null) {
  return amount == null ? "Prix bientôt disponible" : `${new Intl.NumberFormat("fr-FR").format(amount)} Ar / mois`;
}
