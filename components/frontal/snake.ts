// "La serpiente de luz": a line of headlamps climbing the zig-zag trail.
// Drawn on a small canvas that only covers the trail's bounding box (TRAIL_BOX),
// in the panorama's own pixel space, so it stays glued to the image.

import { TRAIL, TRAIL_BOX } from "./data";

interface Lamp {
  /** arclength offset along the trail, image px */
  s0: number;
  /** speed, image px per second */
  v: number;
  size: number;
  /** carries a blinking red rear light */
  red: boolean;
  phase: number;
  freq: number;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sprite(size: number, stops: [number, string][]): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  if (g) {
    const r = size / 2;
    const grad = g.createRadialGradient(r, r, 0, r, r, r);
    for (const [o, col] of stops) grad.addColorStop(o, col);
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
  }
  return c;
}

export class TrailSnake {
  private ctx: CanvasRenderingContext2D | null;
  private cum: number[] = [0];
  private total = 0;
  private lamps: Lamp[] = [];
  private glow: HTMLCanvasElement;
  private red: HTMLCanvasElement;
  private w = 1;
  private h = 1;
  /** canvas px per image px */
  private k = 1;
  /** canvas px per css px */
  private dpr = 1;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d");

    for (let i = 1; i < TRAIL.length; i++) {
      const [x0, y0] = TRAIL[i - 1];
      const [x1, y1] = TRAIL[i];
      this.total += Math.hypot(x1 - x0, y1 - y0);
      this.cum.push(this.total);
    }

    // Runners come in small groups, like a real night start strung out on a climb.
    const rnd = mulberry32(20260828);
    let s = 10;
    while (s < this.total - 30) {
      const n = 1 + Math.floor(rnd() * 4.6);
      const v = 21 + rnd() * 6;
      for (let i = 0; i < n; i++) {
        this.lamps.push({
          s0: s + i * (11 + rnd() * 8),
          v,
          size: 0.82 + rnd() * 0.42,
          red: rnd() < 0.22,
          phase: rnd() * Math.PI * 2,
          freq: 0.7 + rnd() * 1.4,
        });
      }
      s += n * 14 + 42 + rnd() * 118;
    }

    this.glow = sprite(64, [
      [0, "rgba(255,250,238,1)"],
      [0.1, "rgba(255,240,210,0.95)"],
      [0.32, "rgba(255,206,150,0.3)"],
      [1, "rgba(255,170,100,0)"],
    ]);
    this.red = sprite(32, [
      [0, "rgba(255,110,80,1)"],
      [0.3, "rgba(255,60,35,0.45)"],
      [1, "rgba(255,40,20,0)"],
    ]);
  }

  get count(): number {
    return this.lamps.length;
  }

  resize(cssW: number, cssH: number, dpr: number) {
    this.dpr = dpr;
    this.w = Math.max(1, Math.round(cssW * dpr));
    this.h = Math.max(1, Math.round(cssH * dpr));
    this.canvas.width = this.w;
    this.canvas.height = this.h;
    this.k = this.w / TRAIL_BOX.w;
  }

  /** Point + unit direction at arclength s. */
  private at(s: number): [number, number, number, number] {
    let lo = 0;
    let hi = this.cum.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (this.cum[mid] <= s) lo = mid;
      else hi = mid;
    }
    const [x0, y0] = TRAIL[lo];
    const [x1, y1] = TRAIL[hi];
    const len = this.cum[hi] - this.cum[lo] || 1;
    const f = (s - this.cum[lo]) / len;
    return [x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, (x1 - x0) / len, (y1 - y0) / len];
  }

  draw(t: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const { k, dpr } = this;
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.globalCompositeOperation = "lighter";

    for (const L of this.lamps) {
      const s = (((L.s0 + L.v * t) % this.total) + this.total) % this.total;
      const fade = Math.min(1, s / 45) * Math.min(1, (this.total - s) / 120);
      if (fade <= 0.01) continue;
      const bob = 0.78 + 0.22 * Math.sin(t * L.freq * 2.2 + L.phase);
      const a = fade * bob;
      const [x, y, ux, uy] = this.at(s);
      const cx = (x - TRAIL_BOX.x) * k;
      const cy = (y - TRAIL_BOX.y) * k;

      // the pool of light each runner throws on the trail ahead
      const g = 20 * dpr * L.size;
      ctx.globalAlpha = a * 0.2;
      ctx.drawImage(this.glow, cx + ux * 9 * k - g / 2, cy + uy * 9 * k + 1.2 * dpr - g / 2, g, g);

      // the headlamp itself
      const l = 11 * dpr * L.size;
      ctx.globalAlpha = a;
      ctx.drawImage(this.glow, cx - l / 2, cy - 1.2 * dpr - l / 2, l, l);

      if (L.red) {
        const on = Math.sin(t * 4.6 + L.phase) > 0.5 ? 1 : 0.16;
        const r = 6 * dpr;
        ctx.globalAlpha = fade * on * 0.9;
        ctx.drawImage(this.red, cx - ux * 3.5 * k - r / 2, cy - 0.6 * dpr - r / 2, r, r);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }
}
