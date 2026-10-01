// Static data for the Frontal design.
// Coordinates below live in the hero image's own pixel space (3168 x 1344), so any
// overlay drawn in that space stays aligned with the panorama at every viewport.

export const IMG = { w: 3168, h: 1344 } as const;

/**
 * The zig-zag trail up the big mountain's flank, traced by hand on the image
 * (from the rocky ridge in front of you up to the foot of the summit cliffs).
 */
export const TRAIL: ReadonlyArray<readonly [number, number]> = [
  [2096, 914], [2150, 898], [2273, 880], [2370, 865], [2390, 860],
  [2363, 856], [2307, 848], [2253, 835], [2188, 823],
  [2255, 810], [2300, 797], [2330, 787], [2343, 787],
  [2300, 783], [2240, 774], [2168, 766],
  [2240, 753], [2340, 733], [2405, 719], [2424, 716],
  [2380, 708], [2300, 699], [2230, 690], [2162, 682],
  [2240, 667], [2327, 650], [2410, 622], [2480, 605], [2530, 599],
  [2600, 587], [2660, 572], [2705, 563],
];

/** Box (image px) that the trail canvas covers, with room for the glows. */
export const TRAIL_BOX = { x: 2060, y: 530, w: 690, h: 410 } as const;

/** Where the beam rests when nobody is steering it: the middle of the zig-zag. */
export const BEAM_REST = { x: 2370, y: 748 } as const;

/** Real bright stars of the panorama that get an extra twinkle. */
export const TWINKLES: ReadonlyArray<readonly [number, number, number]> = [
  // x, y, size (relative)
  [1531, 104, 1], [2712, 25, 0.8], [802, 16, 0.7], [1039, 24, 0.8], [663, 84, 0.9],
  [1885, 152, 1], [3011, 25, 0.7], [2855, 135, 0.9], [2550, 147, 1], [1224, 73, 0.8],
  [2183, 148, 1], [875, 312, 0.8], [1280, 341, 0.7], [1161, 250, 0.8], [1419, 239, 0.9],
  [2048, 197, 0.9], [2417, 204, 1], [2218, 319, 0.8], [2551, 321, 0.8], [1699, 106, 0.8],
  [2386, 62, 0.7], [2955, 245, 0.7],
];

export interface Chapter {
  id: string;
  /** Story clock, minutes from 00:00 of the first day (may exceed 24 h). */
  min: number;
  label: string;
  /** Element to scroll to from the HUD, when it isn't the chapter itself. */
  target?: string;
}

/**
 * The page is one night run. These clock times are a storytelling device
 * (the hour of each chapter of the story), not the times of real events.
 */
export const CHAPTERS: Chapter[] = [
  { id: "salida", min: 22 * 60 + 47, label: "Salida" },
  { id: "noche", min: 23 * 60 + 15, label: "La noche" },
  { id: "nocturnas", min: 24 * 60 + 40, label: "Nocturnas" },
  { id: "manual", min: 26 * 60 + 10, label: "Manual" },
  { id: "cumbres", min: 27 * 60 + 40, label: "Cumbres" },
  { id: "vertinianos", min: 29 * 60 + 20, label: "Vertinianos" },
  { id: "amanecer", min: 31 * 60 + 12, label: "Amanecer", target: "amanecer-sol" },
];

/** Story-clock milestones used by the HUD: start, summit and sunrise. */
export const CLOCK_START = 22 * 60 + 47;
export const CLOCK_SUMMIT = 30 * 60 + 58;
export const CLOCK_SUNRISE = 31 * 60 + 12;

/** Says out loud that the hours are a story device, not a record of real events. */
export const STORY_NOTE = "Una noche cualquiera, contada hora a hora. Relato ilustrativo.";

/** Story time at the very bottom of the page. */
export const END_MIN = 31 * 60 + 34;

export function clock(min: number): string {
  const m = Math.round(min) % (24 * 60);
  const h = Math.floor(m / 60);
  return `${String(h).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export type Lumens = 100 | 300 | 600 | 1000;

export interface LumenMode {
  lm: Lumens;
  name: string;
  note: string;
  /** Relative autonomy for the little battery bar (illustrative, not a spec). */
  autonomy: number;
}

export const LUMEN_MODES: LumenMode[] = [
  {
    lm: 100,
    name: "Grupo",
    note: "Para caminar en fila, mirar el móvil o comer en un avituallamiento sin deslumbrar a nadie.",
    autonomy: 1,
  },
  {
    lm: 300,
    name: "Pista",
    note: "Trote tranquilo por pista y sendero ancho. El modo de crucero de casi toda la noche.",
    autonomy: 0.62,
  },
  {
    lm: 600,
    name: "Sendero",
    note: "Piedra suelta, raíces y bajadas: ves el relieve antes de pisarlo.",
    autonomy: 0.36,
  },
  {
    lm: 1000,
    name: "Turbo",
    note: "Para buscar una baliza o un desvío. A ráfagas, que se come la batería.",
    autonomy: 0.14,
  },
];

/** "En el chaleco": a pre-start checklist (general advice, not a race rulebook). */
export const VEST = [
  { id: "frontal", item: "Frontal cargado", why: "Y una batería de repuesto: la noche siempre es más larga de lo que parece." },
  { id: "roja", item: "Luz roja trasera", why: "Para que te vean por detrás en pistas y cruces." },
  { id: "manta", item: "Manta térmica", why: "No pesa nada y en un collado con viento vale oro." },
  { id: "cortavientos", item: "Cortavientos", why: "A las tres de la mañana, la cumbre no es la playa." },
  { id: "silbato", item: "Silbato", why: "Si hay que avisar, se oye mucho más que tu voz." },
  { id: "movil", item: "Móvil con batería", why: "Y el track descargado, por si arriba no hay cobertura." },
  { id: "agua", item: "Agua y algo de comer", why: "De noche apetece menos beber. Bebe igual." },
] as const;

/** "Leer el sendero": how to read a trail by headlamp. */
export const TRAIL_TIPS = [
  { title: "Mira tres pasos por delante", body: "El frontal alumbra lo que viene; los pies ya saben dónde están." },
  { title: "Lleva una segunda luz, baja", body: "Una luz en la cintura hace sombras largas y las piedras aparecen en relieve." },
  { title: "Busca la baliza, no el suelo", body: "La cinta reflectante brilla antes de que la veas. Si llevas un rato sin ver ninguna, para y vuelve." },
  { title: "Baja la luz al cruzarte", body: "Nadie quiere mil lúmenes en la cara. Es la cortesía de la noche." },
] as const;

/** "Lo que se oye": a small sound log of a night in the sierra (a story, not a record). */
export const NIGHT_SOUNDS = [
  { at: "00:52", what: "Un cárabo, lejos, a la izquierda del sendero." },
  { at: "01:30", what: "Grillos. Luego, de repente, ya no." },
  { at: "02:14", what: "Piedras rodando ladera abajo: cabras monteses." },
  { at: "03:05", what: "El viento cambia al llegar al collado." },
  { at: "04:40", what: "Tu respiración y el tac-tac de los bastones." },
  { at: "05:58", what: "El primer pájaro. Todavía es de noche." },
] as const;
