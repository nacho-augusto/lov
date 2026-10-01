// Playable classes for LOV QUEST. Game numbers are real game parameters; the
// "en la vida real" lines are composed from @/content in the UI (no invented facts).

export type ClassId = "vertiniano" | "ultra" | "noctambulo" | "cabra" | "novato";
export type SpriteVariant = "tee" | "jacket" | "lamp" | "singlet" | "hair";

export interface RunnerClass {
  id: ClassId;
  name: string;
  role: string;
  quote: string;
  ability: { name: string; desc: string };
  sprite: SpriteVariant;
  /** Value bars (0–10) keyed by the ids in content/values.ts. */
  stats: Record<"esfuerzo" | "montana" | "comunidad" | "aventura", number>;
  game: { hearts: number; jump: number; speed: number; night: boolean };
}

export const CLASSES: RunnerClass[] = [
  {
    id: "vertiniano",
    name: "Vertiniano/a",
    role: "Todoterreno",
    quote: "Sube, mira atrás y sigue. Lo de esperar arriba no se negocia.",
    ability: { name: "Equipación oficial", desc: "Camiseta blanca y naranja. Equilibrado en todo." },
    sprite: "tee",
    stats: { esfuerzo: 8, montana: 9, comunidad: 10, aventura: 8 },
    game: { hearts: 3, jump: 1, speed: 1, night: false },
  },
  {
    id: "ultra",
    name: "Ultrafondista",
    role: "Larga distancia",
    quote: "Mide las carreras en horas, no en kilómetros.",
    ability: { name: "Paso de ultra", desc: "Empieza la partida con un corazón extra." },
    sprite: "jacket",
    stats: { esfuerzo: 10, montana: 8, comunidad: 10, aventura: 9 },
    game: { hearts: 4, jump: 0.96, speed: 1, night: false },
  },
  {
    id: "noctambulo",
    name: "Noctámbulo/a",
    role: "Carreras con frontal",
    quote: "Su hora favorita empieza cuando se enciende el frontal.",
    ability: { name: "Visión nocturna", desc: "Juega de noche con el frontal encendido." },
    sprite: "lamp",
    stats: { esfuerzo: 8, montana: 8, comunidad: 10, aventura: 10 },
    game: { hearts: 3, jump: 1, speed: 1, night: true },
  },
  {
    id: "cabra",
    name: "Cabra montés",
    role: "Cumbres y crestas",
    quote: "Donde los demás ven una pared, ve un sendero.",
    ability: { name: "Salto de cresta", desc: "Salta un 18 % más alto, pero corre algo más rápido." },
    sprite: "singlet",
    stats: { esfuerzo: 9, montana: 10, comunidad: 10, aventura: 9 },
    game: { hearts: 3, jump: 1.18, speed: 1.06, night: false },
  },
  {
    id: "novato",
    name: "Novato/a",
    role: "Primera temporada",
    quote: "Nadie nace sabiendo subir cuestas. Todos empezamos por alguna.",
    ability: { name: "Ritmo de charla", desc: "Arranca más despacio y acelera con calma." },
    sprite: "hair",
    stats: { esfuerzo: 7, montana: 9, comunidad: 10, aventura: 7 },
    game: { hearts: 3, jump: 1, speed: 0.86, night: false },
  },
];

export const DEFAULT_CLASS: ClassId = "vertiniano";

export function classById(id: ClassId): RunnerClass {
  return CLASSES.find((c) => c.id === id) ?? CLASSES[0];
}
