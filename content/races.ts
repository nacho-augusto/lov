// Races the club runs / nearby reference races.
// `ours: true` = events vertinianos have actually taken part in (from Instagram).
// Full dates intentionally omitted (they change each season) — see content/season.ts
// for what happened in 2026.

export interface Race {
  id: string;
  name: string;
  place: string;
  detail: string;
  ours: boolean;
  night?: boolean;
}

export const races: Race[] = [
  {
    id: "omd-utmb",
    name: "OMD by UTMB",
    place: "Portugal · UTMB World Series",
    detail: "167 km y +8.727 m de desnivel. Cuatro finishers vertinianos en 2026, en 38:41 h.",
    ours: true,
    night: true,
  },
  {
    id: "101-ronda",
    name: "101 km de Ronda",
    place: "Serranía de Ronda · La Legión",
    detail: "El gran reto de resistencia de la provincia: 101 km en menos de 24 h. Dos vertinianos en 2026.",
    ours: true,
    night: true,
  },
  {
    id: "leguas-alpujarras",
    name: "XX Leguas Alpujarras",
    place: "Las Alpujarras · Granada/Almería",
    detail: "Aventura de fondo por la Alpujarra; tres de nuestros montañeros, finishers en 2026.",
    ours: true,
  },
  {
    id: "cxm-el-fuerte",
    name: "CxM El Fuerte",
    place: "Frigiliana · Axarquía",
    detail: "Carrera por montaña con vistas de altura sobre la Almijara. Fija en nuestro calendario.",
    ours: true,
  },
  {
    id: "carratraca",
    name: "Nocturna de Carratraca",
    place: "Carratraca · Málaga",
    detail: "Senderos nuevos de noche, en verano.",
    ours: true,
    night: true,
  },
  {
    id: "trail-nocturno-la-jabega",
    name: "CxM Trail Nocturno La Jábega",
    place: "Rincón de la Victoria · en casa",
    detail: "Nuestra montaña y nuestra playa, de noche. Gran parte del club en la salida.",
    ours: true,
    night: true,
  },
  {
    id: "san-anton-trail",
    name: "San Antón Trail Festival",
    place: "Pico San Antón · Málaga",
    detail: "Primera edición en 2026 y broche final a las nocturnas del verano.",
    ours: true,
    night: true,
  },
  {
    id: "pinsapo-trail",
    name: "CxM Pinsapo Trail",
    place: "Yunquera · Parque Nacional Sierra de las Nieves",
    detail: "Referencia del calendario, esencia pura de pinsapar.",
    ours: false,
  },
];
