// League helpers. Months are "YYYY-MM" keys; stored as the first day of the month.

export const MAROMA_M = 2069; // La Maroma, roof of Málaga: the unit for elevation gain

const SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const LONG = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export const isMonthKey = (v: unknown): v is string => typeof v === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(v);

export function addMonths(key: string, n: number) {
  const [y, m] = key.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

export function monthDiff(from: string, to: string) {
  const [y1, m1] = from.split("-").map(Number);
  const [y2, m2] = to.split("-").map(Number);
  return (y2 - y1) * 12 + (m2 - m1);
}

export function monthRange(from: string, to: string) {
  return Array.from({ length: monthDiff(from, to) + 1 }, (_, i) => addMonths(from, i));
}

export const monthShort = (key: string) => SHORT[Number(key.slice(5)) - 1];
export const monthLong = (key: string) => `${LONG[Number(key.slice(5)) - 1]} ${key.slice(0, 4)}`;
export const monthDate = (key: string) => `${key}-01`;

// Effort-km: the usual trail measure that weighs climbing (100 m+ ≈ 1 km).
export const effortKm = (km: number, gain: number) => km + gain / 100;
