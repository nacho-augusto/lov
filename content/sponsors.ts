// "Gracias a quienes lo hacen posible": the supporters the club thanks in its 2026 posts.
// `current: true` = listed in the club's most recent posts (summer 2026).

export interface Sponsor {
  name: string;
  /** Instagram handle without @, when the club tagged one. */
  instagram?: string;
  current: boolean;
}

export const sponsorsIntro = "Gracias a quienes lo hacen posible";

export const sponsors: Sponsor[] = [
  { name: "Turismo Rincón de la Victoria", instagram: "turismoenrincon", current: true },
  { name: "Villa Antiopa", current: true },
  { name: "Morente Estudio Cocinas", instagram: "morentestudiococinas", current: true },
  { name: "Gameplay Stores", instagram: "gameplaystores", current: true },
  { name: "Elazar Salón de Juego", current: true },
  { name: "Obras y Reformas Revestimientos Pérez", current: true },
  { name: "AOVE Málaga", instagram: "aovemalaga", current: false },
  { name: "Interni Esterni Interiorismo", instagram: "interniesterni_interiorismo", current: false },
  { name: "Multiservicios Toro", instagram: "multiserviciostoro", current: false },
  { name: "Fisioterapia y Pilates Vitae", instagram: "fisioterapiaypilatesvitae", current: false },
  { name: "HCC Hotel", instagram: "hcc.hotel", current: false },
  { name: "Alimentación Nando", current: false },
  { name: "Fodinsa Instalaciones", current: false },
  { name: "SD Abogados", current: false },
];
