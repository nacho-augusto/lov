// DORSAL — design-specific copy (es-ES). Real club facts come from `@/content`;
// everything here is either derived from it or clearly humorous race-paperwork
// copy (categories, mandatory kit, penalties), never presented as club rules.

export const sectionIndex = [
  { id: "reglamento", label: "Reglamento", short: "Regl." },
  { id: "clasificacion", label: "Clasificación", short: "Clasif." },
  { id: "perfil", label: "Perfil", short: "Perfil" },
  { id: "fotos", label: "Fotos", short: "Fotos" },
  { id: "inscripcion", label: "Inscripción", short: "Inscr." },
  { id: "patrocinadores", label: "Patrocinadores", short: "Patroc." },
] as const;

export type SectionId = (typeof sectionIndex)[number]["id"];

export function sectionNumber(id: SectionId): string {
  const i = sectionIndex.findIndex((s) => s.id === id);
  return String(i + 1).padStart(2, "0");
}

/** The bib number: La Maroma's altitude, the roof of the province. */
export const BIB = "2069";

/** Humorous race categories (also used as the tick boxes of the entry form). */
export const categories = [
  {
    code: "NOV",
    name: "Novato/a",
    desc: "Primer dorsal, primeras agujetas. Se le espera arriba igual que a todos.",
  },
  {
    code: "VER",
    name: "Vertiniano/a",
    desc: "Categoría general. Barro hasta el tobillo y la bandera en la mochila.",
  },
  {
    code: "CAB",
    name: "Cabra montés",
    desc: "Sube por donde no hay sendero y baja por donde no debería.",
  },
  {
    code: "NOC",
    name: "Nocturno/a",
    desc: "Frontal en la cabeza y pilas de repuesto. Corre mejor con luna.",
  },
] as const;

/** Tongue-in-cheek mandatory kit: common sense, not an official club rule. */
export const mandatoryKit = [
  "Zapatillas con taco: el asfalto se queda abajo.",
  "Frontal cargado, y pilas de repuesto si la cosa es nocturna.",
  "Agua y algo que llevarse a la boca.",
  "Cortavientos: arriba siempre sopla.",
  "Una bolsa para tu basura y para la que te encuentres.",
  "Bandera del club: opcional, pero en meta luce mucho.",
  "Ganas de esperar arriba.",
] as const;

/** Humorous "penalty code". */
export const penalties = [
  {
    level: "Muy grave",
    text: "Dejar basura en el monte. Se recoge, se pide perdón a la montaña y se baja con dos envoltorios ajenos.",
  },
  { level: "Grave", text: "Coronar y no esperar al grupo. Paga los cafés." },
  { level: "Leve", text: "Salirse de las cintas. Diez minutos de vergüenza y un mapa de regalo." },
  { level: "Permitido", text: "Quejarse en la cuesta. La cuesta no se entera." },
] as const;

/**
 * Short result line per season event, phrased from each event's own summary
 * in content/season.ts (no invented results).
 */
export const seasonResults: Record<string, string> = {
  "nocturna-frigiliana": "Una noche entera de montaña",
  "omd-utmb": "4 finishers juntos en meta",
  "ronda-101": "2 vertinianos hasta la meta nocturna",
  "leguas-alpujarras": "3 finishers",
  "cxm-el-fuerte": "Fija en el calendario",
  "pico-del-cielo": "Cima con bandera y bufanda",
  "premios-lov": "Trofeos a los más activos y al compañerismo",
  carratraca: "Entrada en meta juntos",
  "trail-nocturno-la-jabega": "Premio en la categoría local",
  "san-anton-trail": "Primera edición, broche nocturno",
};

/**
 * OMD by UTMB finishing positions of the four club finishers, taken from the
 * club's own OMD post (listed in the project brief; not yet in content/season.ts).
 */
export const omdPositions = "114–117";

/** Photo plates: crop/print style is baked into /public/dorsal/*.png. */
export const plates = [
  { slot: "a", photo: "omd-finishers", file: "fig-01-omd-finishers.png", w: 1100, h: 1100 },
  { slot: "b1", photo: "pico-del-cielo-cruz", file: "fig-02-pico-del-cielo.png", w: 820, h: 573 },
  { slot: "b2", photo: "carratraca-meta", file: "fig-03-carratraca.png", w: 820, h: 573, stamp: "Nocturna" },
  { slot: "c", photo: "el-fuerte-cresta", file: "fig-04-el-fuerte-cresta.png", w: 640, h: 800 },
  { slot: "d", photo: "ronda-101-meta", file: "fig-05-ronda.png", w: 640, h: 800 },
  { slot: "e", photo: "el-fuerte-brazos", file: "fig-06-el-fuerte-brazos.png", w: 640, h: 800 },
  { slot: "f", photo: "omd-expedicion", file: "fig-07-omd-expedicion.png", w: 1240, h: 620 },
  { slot: "g", photo: "san-anton-noche", file: "fig-08-san-anton.png", w: 640, h: 640 },
] as const;
