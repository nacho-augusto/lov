// Races the club runs / nearby reference races.
// `ours: true` = events vertinianos have actually taken part in (from Instagram).
// Dates intentionally omitted (they change each season) — confirm before publishing.

export interface Race {
  id: string;
  name: string;
  place: string;
  detail: string;
  ours: boolean;
}

export const races: Race[] = [
  {
    id: "omd-utmb",
    name: "OMD by UTMB",
    place: "Portugal · UTMB World Series",
    detail: "167 km y +8.727 m de desnivel. Tenemos finishers vertinianos.",
    ours: true,
  },
  {
    id: "leguas-alpujarras",
    name: "XX Leguas Alpujarras",
    place: "Las Alpujarras · Granada/Almería",
    detail: "Aventura de fondo por la Alpujarra; nuestros montañeros sumando kms y cimas.",
    ours: true,
  },
  {
    id: "cxm-el-fuerte",
    name: "CxM El Fuerte",
    place: "Frigiliana · Axarquía",
    detail: "Carrera por montaña en casa, con vistas de altura sobre la Almijara.",
    ours: true,
  },
  {
    id: "101-ronda",
    name: "101 km de Ronda",
    place: "Serranía de Ronda · La Legión",
    detail: "El gran reto de resistencia de la provincia: 101 km en menos de 24 h.",
    ours: false,
  },
  {
    id: "pinsapo-trail",
    name: "CxM Pinsapo Trail",
    place: "Yunquera · Parque Nacional Sierra de las Nieves",
    detail: "Referencia del calendario, esencia pura de pinsapar.",
    ours: false,
  },
];
