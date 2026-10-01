// Shared formatting and form helpers for the admin panel (Spanish, Europe/Madrid).

const TZ = "Europe/Madrid";

export function currentSeason() {
  return Number(new Intl.DateTimeFormat("en", { year: "numeric", timeZone: TZ }).format(new Date()));
}

export function todayISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export function formatDate(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  if (!iso) return "—";
  // Plain dates ("2026-03-01") are calendar days: format them at noon UTC to avoid TZ drift.
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso);
  return new Intl.DateTimeFormat("es-ES", { ...opts, timeZone: iso.length === 10 ? "UTC" : TZ }).format(d);
}

export function fullName(m: { first_name: string; last_name?: string | null }) {
  return [m.first_name, m.last_name].filter(Boolean).join(" ");
}

// Trimmed text field, or null when empty.
export function text(formData: FormData, name: string): string | null {
  const v = String(formData.get(name) ?? "").trim();
  return v === "" ? null : v;
}

// yyyy-mm-dd or null; anything else is treated as empty.
export function date(formData: FormData, name: string): string | null {
  const v = text(formData, name);
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}
