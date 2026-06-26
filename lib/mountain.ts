// Shared mountain silhouette derived from the club logo (an angular, multi-peak
// snow-capped range). Every direction builds its mountain from THIS ridgeline so
// the "recreate the logo's mountain" promise stays consistent across the site.
//
// Normalised points: x 0..1 left→right, y 0..1 where 0 = highest summit, 1 = baseline.

export const ridgePoints: ReadonlyArray<readonly [number, number]> = [
  [0.0, 0.9],
  [0.07, 0.74],
  [0.13, 0.82],
  [0.21, 0.5], // foothill peak
  [0.29, 0.68],
  [0.37, 0.55],
  [0.5, 0.06], // main summit — the logo's tallest peak
  [0.58, 0.4],
  [0.65, 0.26], // second summit
  [0.73, 0.5],
  [0.81, 0.36], // third summit
  [0.9, 0.64],
  [1.0, 0.72],
];

// Indices of the three dominant summits (used to anchor snow caps / peak labels).
export const summitIndices = [3, 6, 8, 10] as const;

export interface RidgePathOptions {
  /** Close the path down to the baseline to make a filled silhouette. */
  closed?: boolean;
  /** Vertical headroom kept above the tallest summit, in px. */
  topPad?: number;
}

/** Build an SVG path string for the ridge scaled to a width × height box. */
export function ridgePath(
  width: number,
  height: number,
  { closed = false, topPad = 0 }: RidgePathOptions = {},
): string {
  const usable = height - topPad;
  const pts = ridgePoints.map(([x, y]) => [x * width, topPad + y * usable]);
  let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i][0].toFixed(2)} ${pts[i][1].toFixed(2)}`;
  }
  if (closed) {
    d += ` L ${width.toFixed(2)} ${height.toFixed(2)} L 0 ${height.toFixed(2)} Z`;
  }
  return d;
}

/** Sample the ridge height (0 top … 1 baseline) at a normalised x via linear interp. */
export function ridgeHeightAt(xNorm: number): number {
  const x = Math.min(1, Math.max(0, xNorm));
  for (let i = 1; i < ridgePoints.length; i++) {
    const [x0, y0] = ridgePoints[i - 1];
    const [x1, y1] = ridgePoints[i];
    if (x <= x1) {
      const t = (x - x0) / (x1 - x0 || 1);
      return y0 + (y1 - y0) * t;
    }
  }
  return ridgePoints[ridgePoints.length - 1][1];
}
