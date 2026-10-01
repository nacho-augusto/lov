// Curated photo library from the club's Instagram (@cdlaotravertiente), 2026 season.
// Files live in /public/club. Every photo was published by the club itself; alt texts
// describe what is visible without naming people (no personal data on the site).

export type PhotoTag =
  | "carrera"
  | "nocturna"
  | "cumbre"
  | "grupo"
  | "bandera"
  | "equipacion"
  | "sendero"
  | "club";

export interface ClubPhoto {
  id: string;
  /** Path relative to /public, ready for next/image (`/club/...`). */
  src: string;
  width: number;
  height: number;
  alt: string;
  /** Short caption for galleries (es-ES). */
  caption: string;
  /** Season event this photo belongs to (see content/season.ts). */
  event: string;
  tags: PhotoTag[];
}

export const photos: ClubPhoto[] = [
  {
    id: "omd-finishers",
    src: "/club/omd-finishers.jpg",
    width: 1440,
    height: 1440,
    alt: "Cuatro vertinianos con la bandera naranja del club bajo el arco de meta de la Oh Meu Deus by UTMB.",
    caption: "Finishers de la OMD by UTMB",
    event: "omd-utmb",
    tags: ["carrera", "bandera", "grupo"],
  },
  {
    id: "omd-expedicion",
    src: "/club/omd-expedicion.jpg",
    width: 1600,
    height: 1600,
    alt: "La expedición vertiniana a la OMD posando con las chaquetas naranjas del club en un mirador.",
    caption: "La expedición, lista para Portugal",
    event: "omd-utmb",
    tags: ["grupo", "equipacion"],
  },
  {
    id: "omd-board",
    src: "/club/omd-board.jpg",
    width: 1440,
    height: 1440,
    alt: "Un vertiniano con la chaqueta naranja del club asomado al cartel de la Oh Meu Deus by UTMB.",
    caption: "It's you in the center",
    event: "omd-utmb",
    tags: ["carrera", "equipacion"],
  },
  {
    id: "ronda-101-meta",
    src: "/club/ronda-101-meta.jpg",
    width: 1204,
    height: 1600,
    alt: "Meta nocturna de los 101 km de Ronda con la bandera naranja del club desplegada.",
    caption: "Meta de los 101 km de Ronda",
    event: "ronda-101",
    tags: ["carrera", "nocturna", "bandera"],
  },
  {
    id: "ronda-tajo",
    src: "/club/ronda-tajo.jpg",
    width: 1080,
    height: 810,
    alt: "Corredor del club por un sendero verde con el Tajo de Ronda y sus casas colgadas al fondo.",
    caption: "Ronda, kilómetro a kilómetro",
    event: "ronda-101",
    tags: ["carrera", "sendero"],
  },
  {
    id: "leguas-finishers",
    src: "/club/leguas-finishers.jpg",
    width: 1440,
    height: 1440,
    alt: "Tres montañeros del club con la bandera en la meta de las XX Leguas, en un pueblo blanco de la Alpujarra.",
    caption: "Finishers de las XX Leguas",
    event: "leguas-alpujarras",
    tags: ["carrera", "bandera", "grupo"],
  },
  {
    id: "leguas-photocall",
    src: "/club/leguas-photocall.jpg",
    width: 1440,
    height: 1440,
    alt: "Dos vertinianos con chaqueta naranja en el photocall de las XX Leguas Alpujarra.",
    caption: "Photocall de las XX Leguas",
    event: "leguas-alpujarras",
    tags: ["carrera", "equipacion"],
  },
  {
    id: "alpujarra-acequia",
    src: "/club/alpujarra-acequia.jpg",
    width: 1080,
    height: 1080,
    alt: "Corredor con dorsal por un sendero de pinar junto a una acequia en la Alpujarra.",
    caption: "Pinar y acequia en la Alpujarra",
    event: "leguas-alpujarras",
    tags: ["carrera", "sendero"],
  },
  {
    id: "alpujarra-bosque",
    src: "/club/alpujarra-bosque.jpg",
    width: 1080,
    height: 1080,
    alt: "Tres corredores por un sendero de bosque entre flores amarillas en la Alpujarra.",
    caption: "Bosque y flores en las XX Leguas",
    event: "leguas-alpujarras",
    tags: ["carrera", "sendero", "grupo"],
  },
  {
    id: "el-fuerte-trio",
    src: "/club/el-fuerte-trio.jpg",
    width: 1600,
    height: 1600,
    alt: "Tres vertinianos con la camiseta del club y sus dorsales tras la CxM El Fuerte.",
    caption: "La equipación, en la CxM El Fuerte",
    event: "cxm-el-fuerte",
    tags: ["carrera", "equipacion", "grupo"],
  },
  {
    id: "el-fuerte-pareja",
    src: "/club/el-fuerte-pareja.jpg",
    width: 1440,
    height: 1440,
    alt: "Dos corredores del club sonrientes con sus dorsales tras la CxM El Fuerte.",
    caption: "Dorsales y sonrisas",
    event: "cxm-el-fuerte",
    tags: ["carrera", "grupo"],
  },
  {
    id: "el-fuerte-cresta",
    src: "/club/el-fuerte-cresta.jpg",
    width: 1080,
    height: 1080,
    alt: "Corredor ascendiendo una cresta rocosa entre la niebla en la CxM El Fuerte de Frigiliana.",
    caption: "Cresta entre la niebla",
    event: "cxm-el-fuerte",
    tags: ["carrera", "cumbre", "sendero"],
  },
  {
    id: "el-fuerte-brazos",
    src: "/club/el-fuerte-brazos.jpg",
    width: 1080,
    height: 1080,
    alt: "Corredor con los brazos abiertos en lo alto de la sierra durante la CxM El Fuerte.",
    caption: "Arriba, con los brazos abiertos",
    event: "cxm-el-fuerte",
    tags: ["carrera", "cumbre"],
  },
  {
    id: "el-fuerte-cima",
    src: "/club/el-fuerte-cima.jpg",
    width: 1080,
    height: 1080,
    alt: "Corredor en solitario sobre una cima rocosa entre la bruma en Frigiliana.",
    caption: "Cima entre la bruma",
    event: "cxm-el-fuerte",
    tags: ["carrera", "cumbre"],
  },
  {
    id: "pico-del-cielo-cruz",
    src: "/club/pico-del-cielo-cruz.jpg",
    width: 1440,
    height: 1440,
    alt: "Vertinianos en la cruz del Pico del Cielo con la bandera del club y una bufanda del Málaga CF.",
    caption: "Pico del Cielo, entreno de sábado",
    event: "pico-del-cielo",
    tags: ["cumbre", "bandera", "grupo"],
  },
  {
    id: "carratraca-salida",
    src: "/club/carratraca-salida.jpg",
    width: 1440,
    height: 1440,
    alt: "Dos corredores del club con sus dorsales bajo el arco de salida de la carrera de Carratraca.",
    caption: "Salida en Carratraca",
    event: "carratraca",
    tags: ["carrera", "equipacion"],
  },
  {
    id: "carratraca-meta",
    src: "/club/carratraca-meta.jpg",
    width: 1440,
    height: 1440,
    alt: "Dos vertinianos cruzan juntos la meta nocturna de Carratraca con los brazos en alto.",
    caption: "Juntos en meta, de noche",
    event: "carratraca",
    tags: ["carrera", "nocturna"],
  },
  {
    id: "premios-mesa",
    src: "/club/premios-mesa.jpg",
    width: 1200,
    height: 1600,
    alt: "Tres vertinianos posan con sus trofeos en el almuerzo de premios del club.",
    caption: "Premios del primer tramo del año",
    event: "premios-lov",
    tags: ["club", "grupo"],
  },
  {
    id: "premios-playa",
    src: "/club/premios-playa.jpg",
    width: 1200,
    height: 1600,
    alt: "Dos vertinianos con un trofeo en la entrega de premios del club, junto al mar.",
    caption: "Reconocimiento al compañerismo",
    event: "premios-lov",
    tags: ["club"],
  },
  {
    id: "san-anton-dorsales",
    src: "/club/san-anton-dorsales.jpg",
    width: 1200,
    height: 1600,
    alt: "Dos corredores del club con frontal y dorsal antes de la carrera nocturna de San Antón.",
    caption: "Frontales listos en San Antón",
    event: "san-anton-trail",
    tags: ["carrera", "nocturna", "equipacion"],
  },
  {
    id: "san-anton-noche",
    src: "/club/san-anton-noche.jpg",
    width: 1440,
    height: 1079,
    alt: "Un vertiniano con frontal saluda al público durante la carrera nocturna de San Antón.",
    caption: "Noche de San Antón",
    event: "san-anton-trail",
    tags: ["carrera", "nocturna"],
  },
];

export function photoById(id: string): ClubPhoto {
  const p = photos.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown club photo: ${id}`);
  return p;
}

export function photosByTag(tag: PhotoTag): ClubPhoto[] {
  return photos.filter((p) => p.tags.includes(tag));
}
