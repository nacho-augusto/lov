import { PAL } from "./palette";

/**
 * A small limestone range rasterised into crisp pixel rows (SVG, decorative):
 * lit left faces, shaded right faces and snow caps, like the club logo's peaks.
 */
export function PixelPeaks({
  w = 100,
  h = 36,
  peaks = [
    { x: 18, h: 26 },
    { x: 50, h: 34 },
    { x: 82, h: 24 },
  ],
  className,
}: {
  w?: number;
  h?: number;
  peaks?: { x: number; h: number }[];
  className?: string;
}) {
  const runs: Record<string, string> = {};
  const add = (col: number, x: number, y: number, len: number) => {
    runs[col] = (runs[col] ?? "") + `M${x} ${y}h${len}v1h${-len}z`;
  };
  for (let y = 0; y < h; y++) {
    let x = 0;
    let cur = -1;
    let start = 0;
    const flush = (end: number) => {
      if (cur >= 0 && end > start) add(cur, start, y, end - start);
    };
    for (x = 0; x < w; x++) {
      let col = -1;
      let best = -1;
      for (const p of peaks) {
        const top = h - p.h;
        const half = y - top;
        if (half < 0 || Math.abs(x - p.x) > half) continue;
        // front-most = tallest at this point
        const height = p.h - Math.abs(x - p.x);
        if (height <= best) continue;
        best = height;
        const snow = half < Math.max(3, Math.round(p.h * 0.22)) && !(half === Math.round(p.h * 0.22) - 1 && (x + y) % 2);
        const lit = x <= p.x;
        col = snow ? (lit ? 5 : 4) : lit ? 3 : 2;
      }
      if (col !== cur) {
        flush(x);
        cur = col;
        start = x;
      }
    }
    flush(w);
  }
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} shapeRendering="crispEdges" aria-hidden="true" preserveAspectRatio="xMidYMax meet">
      {Object.entries(runs).map(([col, d]) => (
        <path key={col} d={d} fill={PAL[Number(col)]} />
      ))}
    </svg>
  );
}

const CLOUD = ["....5555........", "..55555555.555..", ".55555555555555.", "5555555555555555", ".44444444444444."];

/** A tiny pixel cloud (SVG, decorative). */
export function PixelCloud({ className }: { className?: string }) {
  const runs: Record<string, string> = {};
  CLOUD.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === ".") {
        x++;
        continue;
      }
      let e = x + 1;
      while (e < row.length && row[e] === ch) e++;
      runs[ch] = (runs[ch] ?? "") + `M${x} ${y}h${e - x}v1h${-(e - x)}z`;
      x = e;
    }
  });
  return (
    <svg viewBox="0 0 16 5" className={className} shapeRendering="crispEdges" aria-hidden="true">
      {Object.entries(runs).map(([ch, d]) => (
        <path key={ch} d={d} fill={PAL[parseInt(ch, 16)]} />
      ))}
    </svg>
  );
}
