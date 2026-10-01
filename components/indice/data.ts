// ÍNDICE — derived data for the book-like layout.
// Every hard fact comes from `@/content`; this module only orders, numbers and
// cross-references it (chapters, figures, glossary, index of places).

import {
  club,
  peaks,
  photoById,
  season,
  seasonEvents,
  type ClubPhoto,
  type Difficulty,
  type Peak,
  type SeasonEvent,
} from "@/content";

/* ------------------------------------------------------------------ numbers */

/** es-ES thousands separator for every figure (CLDR skips it for 4 digits). */
export function fmtInt(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export const pad2 = (n: number) => String(n).padStart(2, "0");

const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];
const MONTHS_ABBR = [
  "ene.",
  "feb.",
  "mar.",
  "abr.",
  "may.",
  "jun.",
  "jul.",
  "ago.",
  "sept.",
  "oct.",
  "nov.",
  "dic.",
];

export const monthName = (m: number) => MONTHS[m - 1] ?? "";
export const monthAbbr = (m: number) => MONTHS_ABBR[m - 1] ?? "";

const SPELLED_F = ["cero", "una", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce"];
const spellF = (n: number) => SPELLED_F[n] ?? String(n);
const capFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* -------------------------------------------------------------------- peaks */

/** The table reads like an altitude profile: highest first. */
export const peaksByAltitude: Peak[] = [...peaks].sort((a, b) => b.elevation - a.elevation);

/** The roof of the province (La Maroma) is the top of the altitude rail. */
export const summit: Peak = peaksByAltitude[0];
export const SUMMIT_M = summit.elevation;
const lowest: Peak = peaksByAltitude[peaksByAltitude.length - 1];

export const difficultyLevel: Record<Difficulty, number> = {
  Media: 1,
  "Media-alta": 2,
  Alta: 3,
};

/* ------------------------------------------------------------------- season */

export const eventDomId = (id: string) => `ev-${id}`;
export const peakDomId = (id: string) => `cima-${id}`;

export const eventRef = (id: string) => `02.${pad2(seasonEvents.findIndex((e) => e.id === id) + 1)}`;
export const peakRef = (id: string) => `03.${pad2(peaksByAltitude.findIndex((p) => p.id === id) + 1)}`;

/** One figure per row: the first stat, or an honest dash when the club gave none. */
export function keyFigure(ev: SeasonEvent): string {
  const s = ev.stats?.[0];
  if (!s) return "—";
  return /^\d+$/.test(s.value) ? `${s.value} ${s.label.toLowerCase()}` : s.value;
}

/** "mayo de 2026", or the exact date when the club gave one. */
export function eventDate(ev: SeasonEvent): string {
  return /^\d/.test(ev.dateLabel) ? ev.dateLabel : `${monthName(ev.month)} de ${season.year}`;
}

export const isReel = (ev: SeasonEvent) => ev.source.includes("/reel/");

/** Season events that mention a peak by name (title, place or figures). */
export function eventsForPeak(peak: Peak): SeasonEvent[] {
  return seasonEvents.filter((e) =>
    [e.title, e.place, ...(e.stats ?? []).map((s) => s.label)].some((t) => t.includes(peak.name)),
  );
}

/* ------------------------------------------------------------------ figures */

export interface Plate {
  /** Global figure number, as in a book: Fig. 01 is in the title page. */
  fig: string;
  domId: string;
  photo: ClubPhoto;
  title: string;
  meta: string;
  /** Layout slot in the plates grid (see .ix-plates in indice.css). */
  slot: string;
  aspect: string;
  pos?: string;
}

function makePlate(
  n: number,
  photoId: string,
  slot: string,
  aspect: string,
  opts: { title?: string; pos?: string } = {},
): Plate {
  const photo = photoById(photoId);
  const ev = seasonEvents.find((e) => e.id === photo.event);
  return {
    fig: `Fig. ${pad2(n)}`,
    domId: `fig-${pad2(n)}`,
    photo,
    title: opts.title ?? photo.caption,
    meta: ev ? `${ev.title}, ${eventDate(ev)}` : "",
    slot,
    aspect,
    pos: opts.pos,
  };
}

/** Fig. 01 sits on the title page, small and offset. */
export const heroPlate = makePlate(1, "el-fuerte-cima", "hero", "4 / 5", { pos: "50% 40%" });

/** Fig. 02–11: the plates of chapter 04, in reading order. */
export const plates: Plate[] = [
  makePlate(2, "omd-expedicion", "a", "1 / 1"),
  makePlate(3, "omd-finishers", "b", "4 / 5", { title: "Cuatro finishers y una bandera", pos: "58% 50%" }),
  makePlate(4, "ronda-tajo", "c", "4 / 3"),
  makePlate(5, "ronda-101-meta", "d", "3 / 4"),
  makePlate(6, "alpujarra-acequia", "e", "1 / 1"),
  makePlate(7, "el-fuerte-cresta", "f", "1 / 1", { pos: "50% 55%" }),
  makePlate(8, "el-fuerte-trio", "g", "4 / 5", { pos: "50% 45%" }),
  makePlate(9, "pico-del-cielo-cruz", "h", "1 / 1", { title: "Pico del Cielo, 1.508 m" }),
  makePlate(10, "carratraca-meta", "i", "4 / 5", { pos: "50% 55%" }),
  makePlate(11, "san-anton-noche", "j", "4 / 3"),
];

const allPlates = [heroPlate, ...plates];

/** "Fig. 05" for a photo that is printed as a plate, else null. */
export function plateForPhoto(photoId: string): Plate | null {
  return allPlates.find((p) => p.photo.id === photoId) ?? null;
}

/** Plates that show a given peak (cross-reference from the peaks table). */
export function platesForPeak(peak: Peak): Plate[] {
  return allPlates.filter((p) => p.title.includes(peak.name) || p.photo.alt.includes(peak.name));
}

/* ----------------------------------------------------------------- chapters */

export interface Chapter {
  id: string;
  n: string;
  title: string;
  short: string;
  note: string;
}

const firstEvent = seasonEvents[0];
const lastEvent = seasonEvents[seasonEvents.length - 1];

export const chapters: Chapter[] = [
  {
    id: "club",
    n: "01",
    title: "El club",
    short: "Club",
    note: "Manifiesto, principios y ficha",
  },
  {
    id: "temporada",
    n: "02",
    title: season.title,
    short: "Temporada",
    note: `${capFirst(spellF(seasonEvents.length))} citas, de ${monthName(firstEvent.month)} a ${monthName(lastEvent.month)}`,
  },
  {
    id: "cumbres",
    n: "03",
    title: "Cumbres",
    short: "Cumbres",
    note: `${capFirst(spellF(peaks.length))} cimas de Málaga, de ${fmtInt(lowest.elevation)} a ${fmtInt(SUMMIT_M)} m`,
  },
  {
    id: "fotografia",
    n: "04",
    title: "Fotografía",
    short: "Fotografía",
    note: `${capFirst(spellF(plates.length))} láminas de la temporada`,
  },
  {
    id: "contacto",
    n: "05",
    title: "Contacto",
    short: "Contacto",
    note: "Instagram, cómo empezar y agradecimientos",
  },
];

export const appendix: Chapter = {
  id: "apendices",
  n: "A–C",
  title: "Apéndices",
  short: "Apéndices",
  note: "Glosario, lugares y colofón",
};

export const allChapters: Chapter[] = [...chapters, appendix];

/* ----------------------------------------------------------------- glossary */
// General mountain vocabulary (not club facts); the examples cite @/content figures.

const omd = seasonEvents.find((e) => e.id === "omd-utmb");
const omdGain = omd?.stats?.find((s) => s.label.startsWith("Desnivel"))?.value.replace(/^\+/, "");
const omdKm = omd?.stats?.find((s) => s.label === "Distancia")?.value;

export const glossary: { term: string; def: string }[] = [
  { term: "Collado", def: "Paso entre dos cimas: el punto más bajo de la cresta que las une." },
  { term: "CxM", def: "Abreviatura de carrera por montaña." },
  {
    term: "Desnivel positivo",
    def: `Suma de todos los metros que se suben en un recorrido. Se escribe D+.${omdGain ? ` La OMD acumula ${omdGain}.` : ""}`,
  },
  { term: "Finisher", def: "Quien cruza la meta, llegue cuando llegue." },
  { term: "Frontal", def: "Linterna de cabeza. Sin ella no hay nocturnas." },
  { term: "Lapiaz", def: "Caliza esculpida por el agua en surcos y aristas, como la de El Torcal." },
  { term: "Pinsapo", def: "Abeto de las sierras de Ronda y Grazalema; en la Sierra de las Nieves forma bosques únicos." },
  {
    term: "Ultra",
    def: `Carrera más larga que un maratón.${omdKm ? ` La más larga de nuestra temporada: ${omdKm}.` : ""}`,
  },
  { term: "Vertiente", def: "Cada una de las laderas de una montaña. La otra es la que no se ve desde la playa." },
  { term: `${capFirst(club.memberTermSingular)}, -na`, def: `Socio o socia del ${club.name}.` },
];

/* ---------------------------------------------------------- index of places */

export interface PlaceRef {
  label: string;
  target: string;
}

const ev = (id: string): PlaceRef => ({ label: eventRef(id), target: eventDomId(id) });
const pk = (id: string): PlaceRef => ({ label: peakRef(id), target: peakDomId(id) });

/** Toponyms as they appear in @/content, inverted the way a book index would. */
const rawPlaces: { name: string; refs: PlaceRef[] }[] = [
  { name: "Alcaucín", refs: [pk("la-maroma")] },
  { name: "Almijara, Sierra de", refs: [ev("nocturna-frigiliana"), ev("pico-del-cielo"), pk("navachica"), pk("pico-del-cielo")] },
  { name: "Alpujarras, Las", refs: [ev("leguas-alpujarras")] },
  { name: "Antequera", refs: [pk("el-torcal")] },
  { name: "Arroyo de la Miel", refs: [pk("calamorro")] },
  { name: "Axarquía", refs: [ev("cxm-el-fuerte"), pk("la-maroma"), pk("navachica"), pk("pico-del-cielo")] },
  { name: "Benalmádena", refs: [pk("pico-mijas"), pk("calamorro")] },
  { name: "Blanca, Sierra", refs: [pk("la-concha")] },
  { name: "Calamorro", refs: [pk("calamorro")] },
  { name: "Camarolos, Sierra de", refs: [pk("pico-chamizo")] },
  { name: "Canillas de Aceituno", refs: [pk("la-maroma")] },
  { name: "Carratraca", refs: [ev("carratraca")] },
  { name: "Casabermeja", refs: [pk("pico-reina")] },
  { name: "Chamizo, Pico", refs: [pk("pico-chamizo")] },
  { name: "Cielo, Pico del", refs: [ev("nocturna-frigiliana"), ev("pico-del-cielo"), pk("pico-del-cielo")] },
  { name: "Concha, La", refs: [pk("la-concha")] },
  { name: "Frigiliana", refs: [ev("nocturna-frigiliana"), ev("cxm-el-fuerte"), pk("navachica"), pk("pico-del-cielo")] },
  { name: "Juanar, Refugio de", refs: [pk("la-concha")] },
  { name: "Marbella", refs: [pk("la-concha")] },
  { name: "Maroma, La", refs: [pk("la-maroma")] },
  { name: "Mijas, Sierra de", refs: [pk("pico-mijas"), pk("calamorro")] },
  { name: "Montes de Málaga", refs: [pk("pico-reina")] },
  { name: "Navachica", refs: [ev("nocturna-frigiliana"), pk("navachica")] },
  { name: "Nerja", refs: [pk("navachica"), pk("pico-del-cielo")] },
  { name: "Nieves, Sierra de las", refs: [pk("torrecilla")] },
  { name: "Ojén", refs: [pk("la-concha")] },
  { name: "Portugal", refs: [ev("omd-utmb")] },
  { name: "Quejigales, Los", refs: [pk("torrecilla")] },
  { name: "Reina, Pico de la", refs: [pk("pico-reina")] },
  { name: "Rincón de la Victoria", refs: [ev("premios-lov"), ev("trail-nocturno-la-jabega")] },
  { name: "Ronda", refs: [ev("ronda-101"), pk("torrecilla")] },
  { name: "San Antón, Pico", refs: [ev("san-anton-trail")] },
  { name: "Tejeda, Sierra", refs: [pk("la-maroma")] },
  { name: "Tolox", refs: [pk("torrecilla")] },
  { name: "Torcal, El", refs: [pk("el-torcal")] },
  { name: "Torrecilla", refs: [pk("torrecilla")] },
  { name: "Villanueva del Rosario", refs: [pk("pico-chamizo")] },
  { name: "Yunquera", refs: [pk("torrecilla")] },
];

const collator = new Intl.Collator("es", { sensitivity: "base" });

/** Alphabetical (Spanish collation), grouped by initial letter. */
export const placeGroups: { letter: string; places: { name: string; refs: PlaceRef[] }[] }[] = (() => {
  const sorted = [...rawPlaces]
    .map((p) => ({ ...p, refs: [...p.refs].sort((a, b) => a.label.localeCompare(b.label)) }))
    .sort((a, b) => collator.compare(a.name, b.name));
  const groups: { letter: string; places: typeof sorted }[] = [];
  for (const p of sorted) {
    const letter = p.name.charAt(0).toUpperCase();
    const last = groups[groups.length - 1];
    if (last && last.letter === letter) last.places.push(p);
    else groups.push({ letter, places: [p] });
  }
  return groups;
})();

export const placeCount = rawPlaces.length;
