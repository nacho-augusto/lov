// Sample data for the admin mockup. Everything here is invented: no real members.

export const MAROMA_M = 2069; // La Maroma, roof of Málaga: unit for "how much you climbed"

export const months = [
  "oct", "nov", "dic", "ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep",
] as const;
export const monthsLong = [
  "Octubre 2025", "Noviembre 2025", "Diciembre 2025", "Enero 2026", "Febrero 2026",
  "Marzo 2026", "Abril 2026", "Mayo 2026", "Junio 2026", "Julio 2026", "Agosto 2026",
  "Septiembre 2026",
];

export interface LeagueMonth {
  km: number;
  gain: number; // metres of elevation gain
}

export interface LeagueMember {
  name: string;
  months: LeagueMonth[];
}

// Deterministic pseudo-random so the mockup renders the same on server and client.
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const people: Array<[string, number, number]> = [
  // name, base km per month, metres of gain per km
  ["Lucía M.", 150, 52],
  ["Javi R.", 132, 61],
  ["Marta G.", 118, 48],
  ["Antonio P.", 104, 66],
  ["Elena S.", 96, 40],
  ["Pablo C.", 88, 58],
  ["Rocío D.", 70, 45],
  ["Curro L.", 54, 70],
];

export const league: LeagueMember[] = people.map(([name, base, ratio], i) => {
  const rnd = seeded(i * 97 + 13);
  return {
    name,
    months: months.map((_, m) => {
      // Summer dip in July/August, trend up towards the autumn races.
      const season = m === 9 || m === 10 ? 0.72 : 1 + m * 0.012;
      const km = Math.round(base * season * (0.75 + rnd() * 0.5));
      const gain = Math.round((km * ratio * (0.8 + rnd() * 0.4)) / 10) * 10;
      return { km, gain };
    }),
  };
});

export const effortKm = (m: LeagueMonth) => m.km + m.gain / 100;

export function sumRange(member: LeagueMember, from: number, to: number) {
  return member.months.slice(from, to + 1).reduce(
    (acc, m) => ({ km: acc.km + m.km, gain: acc.gain + m.gain }),
    { km: 0, gain: 0 },
  );
}

export const pendingCharges = [
  { member: "Pablo C.", concept: "Cuota anual 2026", amount: 60, overdueDays: 41 },
  { member: "Rocío D.", concept: "Cuota semestral · 2.º sem.", amount: 30, overdueDays: 12 },
  { member: "Curro L.", concept: "Equipación 2026", amount: 45, overdueDays: 6 },
  { member: "Elena S.", concept: "Cuota semestral · 2.º sem.", amount: 30, overdueDays: 0 },
  { member: "Javi R.", concept: "Inscripción Maroma Night", amount: 25, overdueDays: 0 },
];

export const deadlines = [
  { what: "Justificación · Subvención Diputación 2026", date: "19 oct", days: 18, kind: "grant" },
  { what: "Solicitud · Ayudas deportivas Ayto. Rincón", date: "4 nov", days: 34, kind: "grant" },
  { what: "Renovación licencias FAM 2027", date: "1 dic", days: 61, kind: "licence" },
];

export const movements = [
  { date: "29 sep", what: "Bizum · cuota semestral · Marta G.", amount: 30 },
  { date: "26 sep", what: "Avituallamiento salida Navachica", amount: -48.6 },
  { date: "22 sep", what: "Bizum · equipación · Lucía M.", amount: 45 },
  { date: "15 sep", what: "Seguro de actividades · 3.er trimestre", amount: -212 },
];

export const balance = 3482.4;
export const licences = { renewed: 8, total: 22 };

export const eur = (n: number) =>
  n.toLocaleString("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: n % 1 ? 2 : 0, useGrouping: "always" });
export const num = (n: number, d = 0) =>
  n.toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: "always" });
