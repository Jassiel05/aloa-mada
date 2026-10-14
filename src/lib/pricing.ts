/**
 * Tarifs et numéros de paiement — À COMPLÉTER avant la mise en ligne.
 * Mettez les montants en Ariary par mois (ex. 15000) et vos numéros marchands.
 */
export const PRICES: { candidate: number | null; recruiter: number | null } = {
  candidate: null,
  recruiter: null,
};

export const PAYMENT_NUMBERS: { operator: "mvola" | "orange" | "airtel"; label: string; number: string }[] = [
  { operator: "mvola", label: "MVola", number: "[VOTRE NUMÉRO MVOLA]" },
  { operator: "orange", label: "Orange Money", number: "[VOTRE NUMÉRO ORANGE MONEY]" },
  { operator: "airtel", label: "Airtel Money", number: "[VOTRE NUMÉRO AIRTEL MONEY]" },
];

export const PAYEE_NAME = "[NOM DU BÉNÉFICIAIRE]";

export function priceLabel(amount: number | null) {
  return amount == null ? "[PRIX]" : new Intl.NumberFormat("fr-FR").format(amount);
}
