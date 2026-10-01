// Procedural pixel layers for the LOV QUEST title world. Everything is drawn once
// into small offscreen canvases with the 16-colour palette (no smoothing), then
// tiled with integer offsets by the engine. Night versions are palette swaps.

import { FRAMES, type FrameName } from "./atlas";
import { Col, NIGHT_MAP, PAL } from "./palette";

export interface LayerSet {
  sky: HTMLCanvasElement;
  far: HTMLCanvasElement;
  midSet: HTMLCanvasElement;
  midStrip: HTMLCanvasElement;
  ground: HTMLCanvasElement;
  clouds: HTMLCanvasElement[];
}

export interface Layers {
  day: LayerSet;
  night: LayerSet;
  /** Scene unit: vertical size reference (px). */
  S: number;
  groundY: number;
  /** y of the ground canvas top (tufts poke above groundY). */
  groundTop: number;
  farTop: number;
  farBase: number;
  midTop: number;
  horizonY: number;
  /** x of La Maroma's summit inside the far strip, and its top y (screen). */
  maromaX: number;
  maromaTop: number;
  /** Mid-layer x where the sea ends and where the set piece ends. */
  seaEnd: number;
  setEnd: number;
}

// ---------------------------------------------------------------- helpers

const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** Ordered-dither test: true when (x,y) should take the second colour at level 0..16. */
export function dith(x: number, y: number, level: number): boolean {
  return BAYER4[(y & 3) * 4 + (x & 3)] < level;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash(x: number, y = 0): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function canvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

/** A tiny pixel writer over ImageData (fast, exact palette colours). */
class Px {
  data: Uint8ClampedArray;
  img: ImageData;
  /** window pixels that light up in the night palette */
  lights: [number, number][] = [];
  constructor(
    public c: HTMLCanvasElement,
    public w = c.width,
    public h = c.height,
  ) {
    const ctx = c.getContext("2d")!;
    this.img = ctx.createImageData(w, h);
    this.data = this.img.data;
  }
  set(x: number, y: number, col: number) {
    x |= 0;
    y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const rgb = RGB[col];
    const i = (y * this.w + x) * 4;
    this.data[i] = rgb[0];
    this.data[i + 1] = rgb[1];
    this.data[i + 2] = rgb[2];
    this.data[i + 3] = 255;
  }
  rect(x: number, y: number, w: number, h: number, col: number) {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, col);
  }
  get(x: number, y: number): number {
    const i = (y * this.w + x) * 4;
    return this.data[i + 3];
  }
  flush() {
    this.c.getContext("2d")!.putImageData(this.img, 0, 0);
  }
}

/** Window lights recorded per generated canvas (used by the night variant). */
const LIGHTS = new WeakMap<HTMLCanvasElement, [number, number][]>();

function lightUp(c: HTMLCanvasElement, src: HTMLCanvasElement): HTMLCanvasElement {
  const pts = LIGHTS.get(src);
  if (!pts?.length) return c;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = PAL[Col.Gold];
  for (const [x, y] of pts) ctx.fillRect(x, y, 1, 1);
  return c;
}

// cache parsed palette rgb
const RGB = PAL.map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);

/** Exact palette swap of a canvas (used for night variants). */
export function remap(src: HTMLCanvasElement, map: Record<number, number> = NIGHT_MAP): HTMLCanvasElement {
  const out = canvas(src.width, src.height);
  const sctx = src.getContext("2d")!;
  const img = sctx.getImageData(0, 0, src.width, src.height);
  const d = img.data;
  const lut = new Map<number, number[]>();
  RGB.forEach((rgb, i) => lut.set((rgb[0] << 16) | (rgb[1] << 8) | rgb[2], RGB[map[i] ?? i]));
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const to = lut.get((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
    if (to) {
      d[i] = to[0];
      d[i + 1] = to[1];
      d[i + 2] = to[2];
    }
  }
  out.getContext("2d")!.putImageData(img, 0, 0);
  return out;
}

/** Copy an atlas frame onto a canvas context at integer coordinates. */
export function stamp(
  ctx: CanvasRenderingContext2D,
  atlas: CanvasImageSource,
  name: FrameName,
  x: number,
  y: number,
  flip = false,
) {
  const [sx, sy, sw, sh] = FRAMES[name];
  if (!flip) {
    ctx.drawImage(atlas, sx, sy, sw, sh, Math.round(x), Math.round(y), sw, sh);
    return;
  }
  ctx.save();
  ctx.translate(Math.round(x) + sw, Math.round(y));
  ctx.scale(-1, 1);
  ctx.drawImage(atlas, sx, sy, sw, sh, 0, 0, sw, sh);
  ctx.restore();
}

// ---------------------------------------------------------------- layers

function buildSky(W: number, H: number, horizonY: number): HTMLCanvasElement {
  const c = canvas(W, H);
  const p = new Px(c);
  for (let y = 0; y < H; y++) {
    const t = Math.min(1, y / Math.max(1, horizonY));
    // Sky -> mist with ordered dithering, then a thin white haze at the horizon.
    const l1 = Math.max(0, Math.min(16, Math.round(((t - 0.32) / 0.55) * 16)));
    const l2 = Math.max(0, Math.min(12, Math.round(((t - 0.9) / 0.1) * 10)));
    for (let x = 0; x < W; x++) {
      let col: number = Col.Sky;
      if (dith(x, y, l1)) col = Col.Mist;
      if (y > horizonY) col = Col.Mist;
      else if (l2 > 0 && dith(x + 2, y + 1, l2)) col = Col.White;
      p.set(x, y, col);
    }
  }
  p.flush();
  return c;
}

function buildCloud(seed: number, w: number): HTMLCanvasElement {
  const h = Math.round(w * 0.42);
  const c = canvas(w, h);
  const p = new Px(c);
  const rnd = mulberry32(seed);
  const blobs: [number, number, number][] = [];
  const n = 3 + Math.floor(rnd() * 3);
  for (let i = 0; i < n; i++) {
    const r = w * (0.16 + rnd() * 0.14);
    const cx = w * (0.22 + (i / Math.max(1, n - 1)) * 0.56) + (rnd() - 0.5) * w * 0.08;
    const cy = h - r * 0.9 - rnd() * h * 0.15;
    blobs.push([cx, cy, r]);
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let inside = false;
      for (const [cx, cy, r] of blobs) {
        const dx = x + 0.5 - cx;
        const dy = (y + 0.5 - cy) * 1.25;
        if (dx * dx + dy * dy <= r * r) inside = true;
      }
      if (!inside || y > h - 2) continue;
      const shade = y > h * 0.72 ? Col.Mist : Col.White;
      p.set(x, y, y > h * 0.6 && dith(x, y, 6) ? Col.Mist : shade);
    }
  }
  p.flush();
  return c;
}

interface FarResult {
  c: HTMLCanvasElement;
  maromaX: number;
  maromaTopRel: number;
}

function buildFar(PF: number, HF: number, seed: number, maromaFrac: number): FarResult {
  const c = canvas(PF, HF);
  const p = new Px(c);
  const rnd = mulberry32(seed);
  const maromaX = Math.round(PF * maromaFrac);
  type Peak = { x: number; h: number; sl: number; sr: number; flat: number };
  const peaks: Peak[] = [
    // La Maroma: the broad, tallest dome of Sierra Tejeda
    { x: maromaX, h: HF - 4, sl: 0.66, sr: 0.8, flat: 7 },
  ];
  const n = 9;
  for (let i = 0; i < n; i++) {
    const x = (i / n) * PF + rnd() * (PF / n) * 0.8;
    if (Math.abs(x - maromaX) < PF * 0.07) continue;
    peaks.push({
      x,
      h: HF * (0.36 + rnd() * 0.36),
      sl: 0.75 + rnd() * 0.55,
      sr: 0.75 + rnd() * 0.55,
      flat: Math.floor(rnd() * 3),
    });
  }
  // smooth height + owner peak per column (no jitter: clean faces)
  const height = new Float32Array(PF);
  const owner = new Int32Array(PF);
  const ownerX = new Float32Array(PF);
  for (let x = 0; x < PF; x++) {
    let h = HF * 0.2;
    let o = -1;
    let ox = 0;
    peaks.forEach((pk, i) => {
      for (const off of [-PF, 0, PF]) {
        const dx = x - (pk.x + off);
        const ad = Math.max(0, Math.abs(dx) - pk.flat);
        const v = pk.h - ad * (dx < 0 ? pk.sl : pk.sr);
        if (v > h) {
          h = v;
          o = i;
          ox = pk.x + off;
        }
      }
    });
    // limestone ruggedness: mid-frequency ridge noise (periodic in PF)
    const t = (x / PF) * Math.PI * 2;
    h += Math.sin(t * 23 + 0.3) * 1.6 + Math.sin(t * 57 + 1.1) * 1.1 + Math.sin(t * 131 + 2.3) * 0.7;
    height[x] = h;
    owner[x] = o;
    ownerX[x] = ox;
  }
  const snowLine = HF * 0.62;
  for (let x = 0; x < PF; x++) {
    const h = height[x];
    // a 1px broken ridge outline (crags) without disturbing the face shading
    const crag = hash(x, 7) > 0.8 ? 1 : 0;
    const top = Math.round(HF - h) + crag;
    const o = owner[x];
    const pk = o >= 0 ? peaks[o] : null;
    const apexY = pk ? HF - pk.h : HF;
    for (let y = Math.max(0, top); y < HF; y++) {
      const alt = HF - y;
      let lit = true;
      if (pk) {
        // diagonal seam from the apex: left face lit, right face in shade
        const seam = ownerX[x] + pk.flat * 0.5 + (y - apexY) * 0.38;
        lit = x < seam;
      }
      let col: number = lit ? Col.Stone : Col.Dusk;
      // couloirs: diagonal gullies running down from the crest
      const depth = y - top;
      if (depth > 2 && depth < HF * 0.45 && ((x + Math.round(depth * (lit ? 0.9 : -0.9))) % 17 === 0 || (x + Math.round(depth * (lit ? 0.9 : -0.9))) % 17 === 1) && hash(x >> 3, 11) > 0.35) col = lit ? Col.Dusk : Col.Night;
      // limestone ledges: short horizontal strokes
      if (((y * 5 + (x >> 3) * 3) % 9 === 0) && hash(x >> 2, y) > 0.55) col = lit ? Col.Mist : Col.Night;
      const snowAt = snowLine + ((x * 7) % 5) - 2 + (hash(x >> 2, 3) - 0.5) * 5;
      if (alt > snowAt) {
        col = lit ? Col.White : Col.Mist;
        if (((y * 5 + (x >> 3) * 3) % 9 === 0) && hash(x >> 2, y) > 0.6) col = lit ? Col.Mist : Col.Stone;
      }
      // atmospheric haze towards the base
      const hz = Math.max(0, Math.min(12, Math.round(((y / HF - 0.72) / 0.28) * 12)));
      if (hz > 0 && dith(x, y, hz)) col = Col.Mist;
      p.set(x, y, col);
    }
  }
  // geodesic pillar on La Maroma's summit
  const mTop = Math.round(HF - height[maromaX]);
  p.set(maromaX, mTop - 1, Col.White);
  p.set(maromaX, mTop - 2, Col.White);
  p.set(maromaX + 1, mTop - 1, Col.Mist);
  p.set(maromaX + 1, mTop - 2, Col.Mist);
  p.set(maromaX, mTop - 3, Col.Stone);
  p.flush();
  return { c, maromaX, maromaTopRel: mTop - 3 };
}

/** Periodic ridge for the mid hills (tiles seamlessly every PM px). */
function midRidge(u: number, PM: number, HM: number): number {
  const t = (u / PM) * Math.PI * 2;
  return (
    HM * 0.5 +
    Math.sin(t * 2 + 0.4) * HM * 0.2 +
    Math.sin(t * 5 + 1.3) * HM * 0.09 +
    Math.sin(t * 11 + 0.7) * HM * 0.035
  );
}

function drawHillColumn(p: Px, x: number, top: number, HM: number, u: number) {
  for (let y = Math.max(0, top); y < HM; y++) {
    const d = y - top;
    let col: number = Col.Pine;
    if (d < 2) col = Col.Leaf;
    else if (d < 7 && dith(x, y, 10 - d)) col = Col.Leaf;
    // terraces (bancales): dotted earth lines following the slope
    if (d > 4 && (d % 6 === 0) && ((x + (d >> 1)) % 3 !== 0)) col = Col.Earth;
    if (d > 4 && (d % 6 === 1) && hash(u, d) > 0.7) col = Col.Leaf;
    p.set(x, y, col);
  }
}

function drawTree(p: Px, x: number, baseY: number, big: boolean) {
  const r = big ? 3 : 2;
  for (let yy = -r; yy <= r; yy++) {
    for (let xx = -r; xx <= r; xx++) {
      if (xx * xx + yy * yy > r * r + 1) continue;
      const col = yy < 0 && xx < 1 ? Col.Leaf : Col.Pine;
      p.set(x + xx, baseY - r - 1 + yy, col);
    }
  }
  p.set(x, baseY - 1, Col.Earth);
  p.set(x, baseY, Col.Earth);
}

function drawHouse(p: Px, x: number, baseY: number, w: number, h: number, roof: number, seed: number) {
  // white walls with ink outline-ish shadow, terracotta roof, tiny windows
  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) {
      const col = xx === w - 1 ? Col.Mist : Col.White;
      p.set(x + xx, baseY - yy, col);
    }
  }
  for (let xx = -1; xx <= w; xx++) p.set(x + xx, baseY - h, roof);
  if (w >= 4) {
    const wx = x + 1 + Math.floor(hash(seed, 1) * (w - 2));
    const wy = baseY - Math.max(1, h - 2);
    p.set(wx, wy, Col.Ink);
    if (hash(seed, 2) > 0.35) p.lights.push([wx, wy]);
  }
  if (w >= 5 && h >= 4) p.set(x + 1, baseY, Col.Earth);
}

function drawVillage(p: Px, cx: number, ridge: (x: number) => number, seed: number, count: number) {
  const rnd = mulberry32(seed);
  // church tower first (behind)
  const tx = Math.round(cx + (rnd() - 0.5) * 6);
  const tb = Math.round(ridge(tx)) + 2;
  for (let yy = 0; yy < 10; yy++) {
    p.set(tx, tb - yy, Col.White);
    p.set(tx + 1, tb - yy, Col.White);
    p.set(tx + 2, tb - yy, Col.Mist);
  }
  p.set(tx + 1, tb - 8, Col.Ink);
  p.set(tx, tb - 10, Col.Deep);
  p.set(tx + 1, tb - 10, Col.Deep);
  p.set(tx + 2, tb - 10, Col.Deep);
  p.set(tx + 1, tb - 11, Col.Deep);
  for (let i = 0; i < count; i++) {
    const hx = Math.round(cx + (rnd() - 0.5) * count * 4.2);
    const w = 3 + Math.floor(rnd() * 4);
    const h = 2 + Math.floor(rnd() * 3);
    const base = Math.round(ridge(hx + w / 2)) + 2 + Math.floor(rnd() * 3);
    drawHouse(p, hx, base, w, h, rnd() > 0.35 ? Col.Deep : Col.Earth, seed + i);
  }
}

function buildMidStrip(PM: number, HM: number, seed: number): HTMLCanvasElement {
  const c = canvas(PM, HM);
  const p = new Px(c);
  const ridge = (u: number) => HM - midRidge(u, PM, HM);
  for (let x = 0; x < PM; x++) drawHillColumn(p, x, Math.round(ridge(x)), HM, x);
  const rnd = mulberry32(seed);
  // scattered olive/pine trees on slopes
  for (let i = 0; i < PM / 9; i++) {
    const x = Math.floor(rnd() * PM);
    const top = ridge(x);
    const depth = 1 + rnd() * (HM - top) * 0.6;
    drawTree(p, x, Math.round(top + depth), rnd() > 0.6);
  }
  // a white village (pueblo blanco) on the highest hill
  let best = 0;
  let bestX = 0;
  for (let x = 20; x < PM - 20; x++) {
    const v = midRidge(x, PM, HM);
    if (v > best) {
      best = v;
      bestX = x;
    }
  }
  drawVillage(p, bestX, ridge, seed + 11, 9);
  // a second hamlet
  const x2 = (bestX + Math.round(PM * 0.5)) % PM;
  drawVillage(p, Math.max(14, Math.min(PM - 14, x2)), ridge, seed + 23, 5);
  p.flush();
  LIGHTS.set(c, p.lights);
  return c;
}

/**
 * Start-of-world set piece in mid-layer coordinates: the Mediterranean, the beach
 * with a jábega boat, palm trees, a coastal watchtower and the white houses of
 * Rincón de la Victoria climbing the first hill. Ends matching the hill strip.
 */
function buildMidSet(
  SP: number,
  HM: number,
  seaEnd: number,
  seaTopRel: number,
  PM: number,
  atlas: CanvasImageSource | null,
): HTMLCanvasElement {
  const c = canvas(SP, HM);
  const p = new Px(c);
  const stripH0 = midRidge(0, PM, HM);
  const smooth = (a: number, b: number, v: number) => {
    const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  // height (from the bottom) of the land: beach, then the town hill, then the strip
  const landH = (u: number) => {
    if (u < seaEnd) return 5;
    const t = (u - seaEnd) / (SP - seaEnd);
    const town = 5 + smooth(0, 0.42, t) * HM * 0.5 + Math.sin(t * 9) * 1.5;
    const k = smooth(0.62, 1, t);
    return town * (1 - k) + stripH0 * k;
  };
  const ridge = (u: number) => HM - landH(u);
  // the Mediterranean, all the way behind the town
  for (let x = 0; x < SP; x++) {
    for (let y = seaTopRel; y < HM; y++) {
      const d = y - seaTopRel;
      let col: number = Col.Sea;
      if (d === 0) col = Col.Mist;
      else if (d < 3 && dith(x, y, 7 - d * 2)) col = Col.Sky;
      else if (d > 2 && d % 3 === 0 && ((x + d * 5) % 11) < 3) col = Col.Sky;
      p.set(x, y, col);
    }
  }
  // beach strip (sand + foam line)
  for (let x = 0; x < SP; x++) {
    for (let y = HM - 5; y < HM; y++) p.set(x, y, dith(x, y, 3) ? Col.Light : Col.Sand);
    p.set(x, HM - 6, (x + 1) % 4 === 0 ? Col.Mist : Col.White);
  }
  // town hill
  for (let x = Math.floor(seaEnd) - 2; x < SP; x++) drawHillColumn(p, x, Math.round(ridge(x)), HM - 5, x + 999);
  // Rincón de la Victoria: a dense, stepped white town climbing the hill
  const rnd = mulberry32(4242);
  let hx = Math.round(seaEnd) + 1;
  const townEnd = seaEnd + (SP - seaEnd) * 0.66;
  while (hx < townEnd) {
    const w = 4 + Math.floor(rnd() * 3);
    const top = ridge(hx + w / 2);
    let base = HM - 6;
    while (base - 3 > top + 2) {
      const h = 3 + Math.floor(rnd() * 2);
      if (rnd() > 0.12) drawHouse(p, hx, base, w, h, rnd() > 0.35 ? Col.Deep : Col.Earth, hx * 13 + base);
      else drawTree(p, hx + 2, base, false);
      base -= h + 1 + (rnd() > 0.7 ? 1 : 0);
    }
    hx += w + 1;
  }
  // coastal watchtower (torre vigía) on the beach
  const tx = Math.round(seaEnd * 0.7);
  const tb = HM - 6;
  for (let yy = 0; yy < 15; yy++) {
    for (let xx = 0; xx < 5; xx++) p.set(tx + xx, tb - yy, xx === 4 ? Col.Earth : xx === 0 ? Col.Light : Col.Sand);
  }
  for (let xx = -1; xx <= 5; xx++) p.set(tx + xx, tb - 15, Col.Earth);
  p.set(tx - 1, tb - 16, Col.Earth);
  p.set(tx + 1, tb - 16, Col.Earth);
  p.set(tx + 3, tb - 16, Col.Earth);
  p.set(tx + 5, tb - 16, Col.Earth);
  p.set(tx + 2, tb - 10, Col.Ink);
  p.set(tx + 2, tb - 2, Col.Ink);
  p.set(tx + 2, tb - 1, Col.Ink);
  p.flush();
  LIGHTS.set(c, p.lights);

  // sprites (palms, boat) from the atlas, if ready
  if (atlas) {
    const ctx = c.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    const boat = FRAMES.boat;
    stamp(ctx, atlas, "boat", Math.round(seaEnd * 0.36), HM - boat[3] - 2);
    const palm = FRAMES.palm;
    for (const px of [seaEnd * 0.1, seaEnd * 0.52, seaEnd * 0.86]) {
      stamp(ctx, atlas, "palm", Math.round(px), HM - palm[3] - 3);
    }
  }
  return c;
}

function buildGround(PN: number, GH: number, tuft: number): HTMLCanvasElement {
  const H = GH + tuft;
  const c = canvas(PN, H);
  const p = new Px(c);
  for (let x = 0; x < PN; x++) {
    for (let y = tuft; y < H; y++) {
      const d = y - tuft;
      let col: number = Col.Earth;
      if (d === 0) col = Col.Light;
      else if (d < 3) col = Col.Sand;
      else if (d < 5) col = dith(x, y, 8) ? Col.Earth : Col.Sand;
      else {
        const hsh = hash(x >> 1, y >> 1);
        if (hsh > 0.93) col = Col.Sand;
        else if (hsh < 0.05) col = Col.Deep;
        const deep = Math.max(0, Math.min(12, Math.round(((d - GH * 0.55) / (GH * 0.45)) * 12)));
        if (deep > 0 && dith(x, y, deep)) col = Col.Ink;
      }
      p.set(x, y, col);
    }
    // pebbles on the path surface
    if (hash(x, 99) > 0.9) {
      p.set(x, tuft + 1, Col.Stone);
      p.set(x + 1, tuft + 1, Col.Mist);
    }
  }
  // grass tufts + flowers along the trail edge (behind the runner's feet line)
  const rnd = mulberry32(77);
  for (let i = 0; i < PN / 7; i++) {
    const x = Math.floor(rnd() * PN);
    const h = 1 + Math.floor(rnd() * tuft);
    for (let k = 0; k < h; k++) {
      p.set(x, tuft - 1 - k, k === h - 1 ? Col.Leaf : Col.Pine);
      if (rnd() > 0.5) p.set(x + 1, tuft - 1 - Math.floor(k / 2), Col.Leaf);
    }
    if (rnd() > 0.75) p.set(x, tuft - 1 - h, rnd() > 0.5 ? Col.Gold : Col.White);
  }
  p.flush();
  return c;
}

/** Race course markers (balizas): a stake with an orange/white ribbon, drawn on the trail edge. */
export function drawBaliza(ctx: CanvasRenderingContext2D, x: number, groundY: number, t: number) {
  const px = (xx: number, yy: number, col: number) => {
    ctx.fillStyle = PAL[col];
    ctx.fillRect(x + xx, groundY + yy, 1, 1);
  };
  for (let k = 1; k <= 9; k++) px(0, -k, Col.Stone);
  px(0, -10, Col.Ink);
  const flap = Math.floor(t * 5) % 2;
  px(1, -9, Col.Orange);
  px(2, -9 + flap, Col.White);
  px(3, -9, Col.Orange);
  px(1, -8, Col.White);
  px(2, -8 + flap, Col.Orange);
}

// ---------------------------------------------------------------- build

export interface BuildOpts {
  W: number;
  H: number;
  atlas: CanvasImageSource | null;
}

export function buildLayers({ W, H, atlas }: BuildOpts): Layers {
  // Scene unit: keeps mountains sane on tall portrait screens.
  const S = Math.min(H, Math.round(W * 0.78));
  const GH = Math.max(Math.round(S * 0.11), Math.round(H * 0.13), 16);
  const groundY = H - GH;
  const tuft = 4;
  const HM = Math.round(S * 0.3);
  const midTop = groundY + 2 - HM;
  const farBase = groundY - Math.round(S * 0.1);
  const HF = Math.round(S * 0.56);
  const farTop = farBase - HF;
  const horizonY = groundY - Math.round(S * 0.17);
  const PF = Math.max(640, Math.round(W * 2.2));
  const PM = Math.max(480, Math.round(W * 1.6));
  const seaEnd = Math.round(Math.max(110, W * 0.42));
  const SP = seaEnd + Math.round(Math.max(150, W * 0.5));

  const sky = buildSky(W, H, farBase);
  const far = buildFar(PF, HF, 2069, 0.5);
  const midStrip = buildMidStrip(PM, HM, 1832);
  const midSet = buildMidSet(SP, HM, seaEnd, horizonY - midTop, PM, atlas);
  const ground = buildGround(256, GH + 2, tuft);
  const clouds = [buildCloud(3, 34), buildCloud(9, 26), buildCloud(17, 44), buildCloud(29, 20)];

  const day: LayerSet = { sky, far: far.c, midSet, midStrip, ground, clouds };
  const night: LayerSet = {
    sky: remap(sky),
    far: remap(far.c),
    midSet: lightUp(remap(midSet), midSet),
    midStrip: lightUp(remap(midStrip), midStrip),
    ground: remap(ground),
    clouds: clouds.map((c) => remap(c)),
  };
  return {
    day,
    night,
    S,
    groundY,
    groundTop: groundY - tuft,
    farTop,
    farBase,
    midTop,
    horizonY,
    maromaX: far.maromaX,
    maromaTop: farTop + far.maromaTopRel,
    seaEnd,
    setEnd: SP,
  };
}
