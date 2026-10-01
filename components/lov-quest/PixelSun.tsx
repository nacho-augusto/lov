import { PAL } from "./palette";

/** The club's half sun rasterised into crisp pixel rows (SVG, decorative). */
export function PixelSun({ r = 16, className, bands = true }: { r?: number; className?: string; bands?: boolean }) {
  const w = r * 2;
  const h = r;
  let orange = "";
  let light = "";
  let deep = "";
  for (let y = 0; y < h; y++) {
    const dy = h - y - 0.5;
    const half = Math.sqrt(Math.max(0, r * r - dy * dy));
    const x0 = Math.round(r - half);
    const x1 = Math.round(r + half);
    if (x1 <= x0) continue;
    const band = bands && y > h * 0.45 && (h - y) % 4 === 1;
    const row = `M${x0} ${y}h${x1 - x0}v1h${-(x1 - x0)}z`;
    if (band) deep += row;
    else orange += row;
    if (!band && x1 - x0 > 2) light += `M${x0} ${y}h1v1h-1z`;
  }
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} shapeRendering="crispEdges" aria-hidden="true">
      <path d={orange} fill={PAL[13]} />
      <path d={deep} fill={PAL[12]} />
      <path d={light} fill={PAL[14]} />
    </svg>
  );
}
