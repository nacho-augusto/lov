// LOV QUEST design-specific copy (es-ES). Game texts, tips, glossary and gear are
// creative/editorial; anything factual about the club is pulled from @/content.

import type { IconName } from "./icons";

export type Rarity = "legendario" | "epico" | "raro" | "especial" | "comun";

export const RARITY_LABEL: Record<Rarity, string> = {
  legendario: "Legendario",
  epico: "Épico",
  raro: "Raro",
  especial: "Especial",
  comun: "Común",
};

/** Achievement skin for each season event id (content/season.ts). */
export const ACHIEVEMENTS: Record<string, { name: string; icon: IconName; rarity: Rarity }> = {
  "nocturna-frigiliana": { name: "Búho de la Almijara", icon: "moon", rarity: "raro" },
  "omd-utmb": { name: "Oh Meu Deus", icon: "trophy", rarity: "legendario" },
  "ronda-101": { name: "Cien y uno", icon: "medal", rarity: "epico" },
  "leguas-alpujarras": { name: "Veinte leguas", icon: "boot", rarity: "epico" },
  "cxm-el-fuerte": { name: "Asalto al Fuerte", icon: "fort", rarity: "raro" },
  "pico-del-cielo": { name: "Naranja blanquiazul", icon: "cross", rarity: "raro" },
  "premios-lov": { name: "Compañerismo al máximo", icon: "cup", rarity: "especial" },
  carratraca: { name: "Meta a dúo", icon: "finish", rarity: "raro" },
  "trail-nocturno-la-jabega": { name: "Jugar en casa", icon: "boat", rarity: "especial" },
  "san-anton-trail": { name: "Primera edición", icon: "star", rarity: "raro" },
};

/** Level hazards for the world map, paraphrased from each peak's own description. */
export const PEAK_HAZARD: Record<string, string> = {
  "la-maroma": "Jefe final. Ataque especial: la Cuesta del Cielo.",
  torrecilla: "Bosque relicto de pinsapos: no te despistes.",
  navachica: "Terreno serrano, exigente y solitario.",
  "pico-del-cielo": "Collados de la Almijara con el mar de fondo.",
  "pico-chamizo": "Karst, lapiaz y cabras monteses.",
  "el-torcal": "Laberinto de piedra: trote técnico, pie rápido.",
  "la-concha": "El aéreo Salto del Lobo.",
  "pico-mijas": "Series de cuestas frente al Mediterráneo.",
  "pico-reina": "Pinares rompepiernas.",
  calamorro: "Rampa vertical desde Arroyo de la Miel.",
};

export const TIPS = [
  "En las bajadas, mira tres pasos por delante, no a tus pies.",
  "Bebe antes de tener sed y come antes de tener hambre.",
  "Si una subida no se puede correr, se camina fuerte. Eso también es trail.",
  "Frontal cargado y pilas de repuesto: la noche siempre es más larga de lo previsto.",
  "Lo que subes a la montaña, lo bajas de la montaña.",
  "Se sale en grupo, se espera arriba y se baja juntos.",
] as const;

export const GLOSSARY: { term: string; def: string }[] = [
  { term: "Vertiniano/a", def: "Miembro de C.D. La Otra Vertiente. Se le reconoce por el naranja y por esperar arriba." },
  { term: "La otra vertiente", def: "La cara de la montaña que no se ve desde la playa. Ahí empieza el juego." },
  { term: "Desnivel positivo (D+)", def: "Todos los metros que subes, sumados. La OMD by UTMB acumulaba +8.727 m." },
  { term: "Frontal", def: "Linterna de cabeza. Sin frontal no hay nocturna." },
  { term: "Finisher", def: "Quien cruza la meta. Da igual el puesto: cuenta haber llegado." },
  { term: "Avituallamiento", def: "Parada para comer y beber. El rincón más feliz de cualquier carrera." },
  { term: "Pájara", def: "Cuando el cuerpo dice «hasta aquí». Se previene con geles y paciencia." },
  { term: "Cresta", def: "El filo de la montaña. Se pisa con cuidado y se disfruta con calma." },
  { term: "Corredor escoba", def: "Quien cierra la carrera para que nadie se quede atrás." },
  { term: "Bancales", def: "Terrazas de cultivo de la Axarquía. Rompepiernas de serie." },
];

export const INVENTORY: { name: string; icon: IconName; rarity: Rarity; desc: string }[] = [
  { name: "Zapatillas de trail", icon: "shoe", rarity: "comun", desc: "Con taco para el barro y la caliza suelta." },
  { name: "Chaleco de hidratación", icon: "vest", rarity: "comun", desc: "Agua, geles y material obligatorio, sin botes." },
  { name: "Gel energético", icon: "gel", rarity: "comun", desc: "Energía al instante. Mejor antes de la pájara que después." },
  { name: "Frontal", icon: "lamp", rarity: "raro", desc: "Imprescindible en nocturnas. Con pilas de repuesto." },
  { name: "Bastones", icon: "poles", rarity: "raro", desc: "Tracción a cuatro patas para las subidas largas." },
  { name: "Cortavientos", icon: "jacket", rarity: "raro", desc: "En la cumbre siempre hace más frío del que crees." },
  { name: "Manta térmica", icon: "blanket", rarity: "epico", desc: "Pesa casi nada y puede salvarte el día." },
  { name: "Silbato", icon: "whistle", rarity: "comun", desc: "Material obligatorio en muchas carreras de montaña." },
  { name: "Gorra", icon: "cap", rarity: "comun", desc: "Para el sol de la Axarquía, que no perdona." },
  {
    name: "Bandera del club",
    icon: "flag",
    rarity: "legendario",
    desc: "Objeto único: se despliega en metas y cumbres. La han visto la OMD, Ronda, las XX Leguas y el Pico del Cielo.",
  },
];

export const BESTIARY: { name: string; sprite: "rock_l" | "goat0" | "bush" | "gel" | "flag0"; desc: string }[] = [
  { name: "Piedra caliza", sprite: "rock_l", desc: "No se mueve, pero no perdona. Salta corto." },
  { name: "Cabra montés", sprite: "goat0", desc: "Dueña de la sierra. Camina hacia ti: salta largo." },
  { name: "Aulaga", sprite: "bush", desc: "Matorral con flores amarillas. Pincha, y mucho." },
  { name: "Gel", sprite: "gel", desc: "+15 m de desnivel y 50 puntos. Cógelo en el aire." },
  { name: "Bandera de cumbre", sprite: "flag0", desc: "Aparece al superar la altitud de cada cumbre de Málaga." },
];
