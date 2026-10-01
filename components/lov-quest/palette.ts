// LOV QUEST: a strict 16-colour palette built around the club orange.
// Index order matches the asset forge (hex digit per colour).

export const PAL = [
  "#0e0c15", // 0 ink
  "#1d1a35", // 1 night
  "#433c6b", // 2 dusk
  "#8f8aa6", // 3 stone
  "#c7e3f0", // 4 mist
  "#fbf7ef", // 5 white
  "#1f5a8f", // 6 sea
  "#57a0db", // 7 sky
  "#2a5c47", // 8 pine
  "#5b9c4c", // 9 leaf
  "#7b4b32", // a earth
  "#d7a266", // b sand
  "#c2470c", // c deep orange
  "#f26b1d", // d club orange
  "#ff8a3d", // e light orange
  "#ffd166", // f gold
] as const;

export const Col = {
  Ink: 0,
  Night: 1,
  Dusk: 2,
  Stone: 3,
  Mist: 4,
  White: 5,
  Sea: 6,
  Sky: 7,
  Pine: 8,
  Leaf: 9,
  Earth: 10,
  Sand: 11,
  Deep: 12,
  Orange: 13,
  Light: 14,
  Gold: 15,
} as const;

/** Night palette swap (classic NES-style): every index is remapped, nothing new is added. */
export const NIGHT_MAP: Record<number, number> = {
  [Col.Ink]: Col.Ink,
  [Col.Night]: Col.Ink,
  [Col.Dusk]: Col.Night,
  [Col.Stone]: Col.Dusk,
  [Col.Mist]: Col.Dusk,
  [Col.White]: Col.Stone,
  [Col.Sea]: Col.Night,
  [Col.Sky]: Col.Night,
  [Col.Pine]: Col.Ink,
  [Col.Leaf]: Col.Pine,
  [Col.Earth]: Col.Night,
  [Col.Sand]: Col.Dusk,
  [Col.Deep]: Col.Dusk,
  [Col.Orange]: Col.Deep,
  [Col.Light]: Col.Dusk,
  [Col.Gold]: Col.Gold,
};
