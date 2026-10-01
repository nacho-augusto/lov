// The club's 2026 season, reconstructed from its own Instagram posts (@cdlaotravertiente).
// Only facts stated in those posts are used: no invented dates, times or results.
// People are referred to collectively (no names on the site).

export type SeasonKind = "ultra" | "carrera" | "nocturna" | "aventura" | "entreno" | "club";

export interface SeasonStat {
  value: string;
  label: string;
}

export interface SeasonEvent {
  id: string;
  /** Month number (1–12) for ordering and timelines. */
  month: number;
  /** Human label, es-ES ("Mayo 2026" or an exact date when the club gave one). */
  dateLabel: string;
  title: string;
  place: string;
  kind: SeasonKind;
  /** Raced or run (partly) at night. */
  night: boolean;
  summary: string;
  stats?: SeasonStat[];
  /** Photo ids from content/photos.ts, best first. */
  photos: string[];
  /** The Instagram post this entry is based on. */
  source: string;
}

export const season = {
  year: 2026,
  title: "Temporada 2026",
  intro:
    "Del primer frontal de abril a las nocturnas de agosto: así ha sido el año vertiniano, contado por el propio club.",
  next: "Seguimos poniéndonos a punto para el otoño.",
} as const;

export const seasonEvents: SeasonEvent[] = [
  {
    id: "nocturna-frigiliana",
    month: 4,
    dateLabel: "Abril 2026",
    title: "Aventura nocturna en Frigiliana",
    place: "Frigiliana · Sierra de Almijara",
    kind: "aventura",
    night: true,
    summary:
      "La propuesta de uno de los nuestros: una noche entera de montaña subiendo a Navachica y al Pico del Cielo, con invitados de Triaworld Mountain.",
    stats: [
      { value: "1.832 m", label: "Navachica" },
      { value: "1.508 m", label: "Pico del Cielo" },
    ],
    photos: [],
    source: "https://www.instagram.com/cdlaotravertiente/reel/DXCvjEmDI_E/",
  },
  {
    id: "omd-utmb",
    month: 5,
    dateLabel: "Mayo 2026",
    title: "Oh Meu Deus by UTMB",
    place: "Portugal · UTMB World Series",
    kind: "ultra",
    night: true,
    summary:
      "La expedición vertiniana del año: cuatro de los nuestros cruzaron juntos la meta de la OMD tras más de 38 horas de carrera.",
    stats: [
      { value: "167 km", label: "Distancia" },
      { value: "+8.727 m", label: "Desnivel positivo" },
      { value: "38:41 h", label: "Tiempo en meta" },
      { value: "4", label: "Finishers vertinianos" },
    ],
    photos: ["omd-finishers", "omd-expedicion", "omd-board"],
    source: "https://www.instagram.com/cdlaotravertiente/p/DX3dyHbjI9y/",
  },
  {
    id: "ronda-101",
    month: 5,
    dateLabel: "Mayo 2026",
    title: "101 km de Ronda",
    place: "Serranía de Ronda",
    kind: "ultra",
    night: true,
    summary:
      "Dos corazones naranjas en la gran prueba de resistencia de la provincia, disfrutándola hasta la meta nocturna con la bandera del club.",
    stats: [
      { value: "101 km", label: "Distancia" },
      { value: "2", label: "Vertinianos" },
    ],
    photos: ["ronda-101-meta", "ronda-tajo"],
    source: "https://www.instagram.com/cdlaotravertiente/p/DYPcH1iDHow/",
  },
  {
    id: "leguas-alpujarras",
    month: 5,
    dateLabel: "Mayo 2026",
    title: "XX Leguas Alpujarras",
    place: "Las Alpujarras",
    kind: "carrera",
    night: false,
    summary:
      "Tres montañeros del club de aventura por la Alpujarra: carrera terminada, buen ambiente y un recorrido para repetir.",
    stats: [{ value: "3", label: "Finishers" }],
    photos: ["leguas-finishers", "alpujarra-bosque", "alpujarra-acequia", "leguas-photocall"],
    source: "https://www.instagram.com/cdlaotravertiente/p/DYrOlrgjO9E/",
  },
  {
    id: "cxm-el-fuerte",
    month: 6,
    dateLabel: "Junio 2026",
    title: "CxM El Fuerte",
    place: "Frigiliana · Axarquía",
    kind: "carrera",
    night: false,
    summary:
      "Gran recorrido y vistas desde las alturas de Frigiliana. Ya está marcada en nuestro calendario para las próximas ediciones.",
    photos: ["el-fuerte-trio", "el-fuerte-cresta", "el-fuerte-brazos", "el-fuerte-cima", "el-fuerte-pareja"],
    source: "https://www.instagram.com/cdlaotravertiente/p/DZfcBMGjLyH/",
  },
  {
    id: "pico-del-cielo",
    month: 6,
    dateLabel: "Junio 2026",
    title: "Entreno de sábado al Pico del Cielo",
    place: "Sierra de Almijara · 1.508 m",
    kind: "entreno",
    night: false,
    summary:
      "Subida de entrenamiento con la bandera del club y la bufanda del Málaga CF: ese día nuestro naranja fue blanquiazul.",
    stats: [{ value: "1.508 m", label: "Pico del Cielo" }],
    photos: ["pico-del-cielo-cruz"],
    source: "https://www.instagram.com/cdlaotravertiente/p/DZzFSpkDPB_/",
  },
  {
    id: "premios-lov",
    month: 7,
    dateLabel: "Julio 2026",
    title: "Premios del primer tramo del año",
    place: "Rincón de la Victoria",
    kind: "club",
    night: false,
    summary:
      "Almuerzo en casa y reconocimiento a los corredores más activos del club, con mención especial al compañerismo dentro y fuera de la montaña.",
    photos: ["premios-mesa", "premios-playa"],
    source: "https://www.instagram.com/cdlaotravertiente/p/DaakyWdDKxT/",
  },
  {
    id: "carratraca",
    month: 7,
    dateLabel: "Julio 2026",
    title: "Nocturna de Carratraca",
    place: "Carratraca · Málaga",
    kind: "nocturna",
    night: true,
    summary: "Nuevos senderos de noche y otra carrera al bolsillo: nuestra pareja clásica entró junta en meta.",
    photos: ["carratraca-meta", "carratraca-salida"],
    source: "https://www.instagram.com/cdlaotravertiente/p/Da0NbHDDN2R/",
  },
  {
    id: "trail-nocturno-la-jabega",
    month: 8,
    dateLabel: "Agosto 2026",
    title: "CxM Trail Nocturno La Jábega",
    place: "Rincón de la Victoria · en casa",
    kind: "nocturna",
    night: true,
    summary:
      "Correr en nuestra montaña y en nuestra playa. Gran parte del club en la salida, ambiente antes, durante y después, y premio en la categoría local.",
    photos: [],
    source: "https://www.instagram.com/cdlaotravertiente/reel/Db6kOoTs5Qv/",
  },
  {
    id: "san-anton-trail",
    month: 8,
    dateLabel: "28 de agosto de 2026",
    title: "San Antón Trail Festival",
    place: "Pico San Antón · Málaga",
    kind: "nocturna",
    night: true,
    summary:
      "Primera edición, muy cerca de casa: vistas, ambiente y el broche final a las carreras nocturnas del verano.",
    photos: ["san-anton-noche", "san-anton-dorsales"],
    source: "https://www.instagram.com/cdlaotravertiente/p/Dc6KBe4DNOD/",
  },
];

/** Headline numbers for the 2026 season (all derived from the entries above). */
export const seasonStats: SeasonStat[] = [
  { value: "10", label: "Citas en la temporada" },
  { value: "4", label: "Finishers en la OMD by UTMB" },
  { value: "5", label: "Carreras con frontal" },
  { value: "167", label: "Km en una sola carrera" },
];

export const seasonKindLabel: Record<SeasonKind, string> = {
  ultra: "Ultra",
  carrera: "Carrera",
  nocturna: "Nocturna",
  aventura: "Aventura",
  entreno: "Entreno",
  club: "Club",
};
