// A 3x5 pixel font for tiny in-world labels drawn on the game canvas.

const GLYPHS: Record<string, string> = {
  A: "010101111101101",
  B: "110101110101110",
  C: "011100100100011",
  D: "110101101101110",
  E: "111100110100111",
  F: "111100110100100",
  G: "011100101101011",
  H: "101101111101101",
  I: "111010010010111",
  J: "001001001101010",
  K: "101101110101101",
  L: "100100100100111",
  M: "101111111101101",
  N: "110101101101101",
  O: "010101101101010",
  P: "110101110100100",
  Q: "010101101110011",
  R: "110101110101101",
  S: "011100010001110",
  T: "111010010010010",
  U: "101101101101011",
  V: "101101101010010",
  W: "101101111111101",
  X: "101101010101101",
  Y: "101101010010010",
  Z: "111001010100111",
  "0": "111101101101111",
  "1": "010110010010111",
  "2": "110001010100111",
  "3": "110001010001110",
  "4": "101101111001001",
  "5": "111100110001110",
  "6": "011100110101010",
  "7": "111001010010010",
  "8": "010101010101010",
  "9": "010101011001110",
  ".": "000000000000010",
  ",": "000000000010100",
  "+": "000010111010000",
  "-": "000000111000000",
  "!": "010010010000010",
  ":": "000010000010000",
  "/": "001001010100100",
  "'": "010010000000000",
  " ": "000000000000000",
};

const NORMALIZE: Record<string, string> = { Á: "A", É: "E", Í: "I", Ó: "O", Ú: "U", Ü: "U", Ñ: "N", "¡": "!" };

export function textWidth(s: string): number {
  return Math.max(0, s.length * 4 - 1);
}

/** Draw text with an optional 1px drop shadow. Coordinates are integer game pixels. */
export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  shadow?: string,
) {
  const s = text.toUpperCase();
  if (shadow) drawRaw(ctx, s, x + 1, y + 1, shadow);
  drawRaw(ctx, s, x, y, color);
}

function drawRaw(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  let cx = Math.round(x);
  const cy = Math.round(y);
  for (const raw of s) {
    const ch = NORMALIZE[raw] ?? raw;
    const g = GLYPHS[ch] ?? GLYPHS[" "];
    for (let i = 0; i < 15; i++) {
      if (g[i] === "1") ctx.fillRect(cx + (i % 3), cy + Math.floor(i / 3), 1, 1);
    }
    cx += 4;
  }
}
