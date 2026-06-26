// The peaks featured in "Las cumbres de Málaga".
// Data verified via research (es.wikipedia.org, i-sierradelasnieves.com, turismo.marbella.es, etc.).
// `home: true` marks the club's own backyard (Sierra de Almijara/Tejeda, Axarquía).
// Elevations for Navachica / Pico del Cielo are widely cited; confirm before publishing.

export type Difficulty = "Media" | "Media-alta" | "Alta";

export interface Peak {
  id: string;
  name: string;
  elevation: number; // metres
  sierra: string;
  area: string;
  difficulty: Difficulty;
  home: boolean;
  featured: boolean;
  why: string;
  route: string;
  // image filled later from /public (Instagram or generated)
  image?: string;
}

// Ordered high → low so the list reads like an altitude profile.
export const peaks: Peak[] = [
  {
    id: "la-maroma",
    name: "La Maroma",
    elevation: 2069,
    sierra: "Sierra Tejeda",
    area: "Axarquía · Canillas de Aceituno / Alcaucín",
    difficulty: "Alta",
    home: true,
    featured: true,
    why: "El techo de la provincia de Málaga y la montaña reina de la Axarquía, en la frontera con Granada.",
    route: "Subida clásica desde El Robledal o la dura Cuesta del Cielo: 24-28 km y ~1.500 m+. Salida nocturna en verano para coronar al amanecer.",
  },
  {
    id: "torrecilla",
    name: "Torrecilla",
    elevation: 1919,
    sierra: "Sierra de las Nieves",
    area: "Parque Nacional · Los Quejigales (Ronda/Yunquera/Tolox)",
    difficulty: "Media-alta",
    home: false,
    featured: true,
    why: "Cima del primer Parque Nacional del interior de Andalucía (2021), entre bosques relictos de pinsapo.",
    route: "Quejigales → Cañada del Cuerno → Puerto de los Pilones → cima. Circular de ~16-18 km por el pinsapar.",
  },
  {
    id: "navachica",
    name: "Navachica",
    elevation: 1832,
    sierra: "Sierra de Almijara",
    area: "Axarquía · Nerja / Frigiliana",
    difficulty: "Alta",
    home: true,
    featured: true,
    why: "La cima más alta de la Almijara, nuestro patio de atrás. Mármol, barrancos y mar de fondo.",
    route: "Largas aproximaciones desde Frigiliana o el río Chíllar; terreno serrano, exigente y solitario.",
  },
  {
    id: "pico-del-cielo",
    name: "Pico del Cielo",
    elevation: 1508,
    sierra: "Sierra de Almijara",
    area: "Axarquía · Frigiliana / Nerja",
    difficulty: "Media-alta",
    home: true,
    featured: false,
    why: "Balcón sobre la Costa del Sol oriental; uno de nuestros clásicos de aventura nocturna.",
    route: "Desde Frigiliana enlazando collados de la Almijara; vistas al Mediterráneo y a Marruecos en días claros.",
  },
  {
    id: "pico-chamizo",
    name: "Pico Chamizo",
    elevation: 1641,
    sierra: "Sierra de Camarolos",
    area: "Cordillera Antequerana · Villanueva del Rosario",
    difficulty: "Media-alta",
    home: false,
    featured: false,
    why: "Panorámica de 360º de casi toda la provincia; karst, lapiaz y cabra montés.",
    route: "Integral desde Los Llanos de Hondonero: Cruz de Camarolos → crestas → Chamizo. ~12-15 km.",
  },
  {
    id: "el-torcal",
    name: "El Torcal",
    elevation: 1344,
    sierra: "Sierra del Torcal",
    area: "Antequera · Camorro de las Siete Mesas",
    difficulty: "Media",
    home: false,
    featured: true,
    why: "Uno de los paisajes kársticos más espectaculares de Europa: un laberinto de piedra con fósiles de ammonites.",
    route: "Encadenar Ruta Verde y Amarilla y subir al Camorro Alto. ~8-10 km de trote técnico, pie rápido.",
  },
  {
    id: "la-concha",
    name: "La Concha",
    elevation: 1215,
    sierra: "Sierra Blanca",
    area: "Marbella · Ojén (Refugio de Juanar)",
    difficulty: "Alta",
    home: false,
    featured: false,
    why: "La reina de Sierra Blanca y mirador de toda la Costa del Sol, con el aéreo Salto del Lobo.",
    route: "Juanar → Puerto de Marbella → cresta → Salto del Lobo → cima. Ida y vuelta técnica de ~12 km.",
  },
  {
    id: "pico-mijas",
    name: "Pico Mijas",
    elevation: 1150,
    sierra: "Sierra de Mijas",
    area: "Costa del Sol · Mijas / Benalmádena",
    difficulty: "Media",
    home: false,
    featured: false,
    why: "Balcón entre el Valle del Guadalhorce y el mar; sierra de entrenamiento diario a pie de costa.",
    route: "Desde Puerto Colorado por el Sendero Naranja a la cima; series de cuestas con el Mediterráneo enfrente.",
  },
  {
    id: "pico-reina",
    name: "Pico de la Reina",
    elevation: 1032,
    sierra: "Montes de Málaga",
    area: "A las puertas de la capital · Málaga / Casabermeja",
    difficulty: "Media",
    home: false,
    featured: false,
    why: "Cota más alta del pulmón verde de Málaga; pinares rompepiernas para tiradas de fondo.",
    route: "Bucle Pico Reina · Pico del Viento · Cerro Cuéllar desde Torrijos. ~25-32 km de pista y sendero.",
  },
  {
    id: "calamorro",
    name: "Calamorro",
    elevation: 771,
    sierra: "Sierra de Mijas",
    area: "Benalmádena · Arroyo de la Miel",
    difficulty: "Media",
    home: false,
    featured: false,
    why: "El pico más accesible de la Costa, ideal para iniciarse al trail y para cuestas cortas después de trabajar.",
    route: "Subida vertical desde Arroyo de la Miel enlazando los senderos R-1 y R-2. Circular corta y exigente.",
  },
];

// Iconic landmarks (not race terrain, but part of our map).
export const landmarks = [
  {
    id: "el-saltillo",
    name: "El Saltillo",
    area: "Canillas de Aceituno · Axarquía",
    note: "Puente colgante a 70 m sobre el Almanchares, el tercero más largo de España. La puerta a La Maroma.",
  },
  {
    id: "caminito-del-rey",
    name: "Caminito del Rey",
    area: "El Chorro · Desfiladero de los Gaitanes",
    note: "Pasarelas colgadas sobre el cañón de los Gaitanes; icono absoluto del senderismo malagueño.",
  },
] as const;
