// Money helpers: amounts are integer cents everywhere; euros only at the edges.

export function eur(cents: number | null | undefined) {
  const v = (cents ?? 0) / 100;
  return v.toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: Number.isInteger(v) ? 0 : 2,
    maximumFractionDigits: 2,
    useGrouping: "always",
  });
}

// "12", "12,5", "12.50", "1.500", "1.234,56" → cents. Null when not a positive amount.
export function parseEuros(input: FormDataEntryValue | null): number | null {
  let s = String(input ?? "").trim().replace(/\s|€/g, "");
  if (!s) return null;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  // Without a comma, "1.500" or "12.000" is a Spanish thousands separator.
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const cents = Math.round(Number(s) * 100);
  return cents > 0 ? cents : null;
}

// Cents → value for an <input> ("12,50").
export function euroInput(cents: number | null | undefined) {
  if (!cents) return "";
  return (cents / 100).toFixed(2).replace(".", ",").replace(",00", "");
}

export const periodicityLabels = {
  one_off: "Pago único",
  monthly: "Mensual",
  bimonthly: "Bimestral",
  quarterly: "Trimestral",
  semiannual: "Semestral",
  annual: "Anual",
} as const;
export type Periodicity = keyof typeof periodicityLabels;

export const methodLabels = {
  bizum: "Bizum",
  transfer: "Transferencia",
  cash: "Efectivo",
  card: "Tarjeta",
  other: "Otro",
} as const;
export type PaymentMethod = keyof typeof methodLabels;

export const chargeStatusLabels = {
  pending: "Pendiente",
  partial: "Pago parcial",
  overdue: "Vencida",
  paid: "Pagada",
  waived: "Condonada",
} as const;
export type ChargeStatus = keyof typeof chargeStatusLabels;

// Tone used by the status diamond.
export const chargeStatusTone: Record<ChargeStatus, string> = {
  pending: "pending",
  partial: "pending",
  overdue: "overdue",
  paid: "done",
  waived: "pending",
};
