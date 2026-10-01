import s from "./admin.module.css";

// Cumulative club effort drawn as an elevation profile: the season is a climb.
// `from`/`to` are month indices of the selected range, shaded in sun orange.
export function ProfileChart({
  values,
  labels,
  from,
  to,
  compareFrom,
  compareTo,
}: {
  values: number[];
  labels: readonly string[];
  from: number;
  to: number;
  compareFrom?: number | null;
  compareTo?: number | null;
}) {
  const W = 960;
  const H = 260;
  const pad = { l: 8, r: 8, t: 24, b: 8 };
  const max = Math.max(1, ...values) * 1.08;
  const step = (W - pad.l - pad.r) / (values.length - 1);
  const x = (i: number) => pad.l + i * step;
  const y = (v: number) => H - pad.b - (v / max) * (H - pad.t - pad.b);
  const line = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(values.length - 1)} ${H} L${x(0)} ${H} Z`;
  const band = (a: number, b: number) => ({ x: x(a) - step / 2, w: (b - a + 1) * step });
  const sel = band(from, to);
  // Bands are clipped to the visible window; a range fully outside it isn't drawn.
  const clip = (a?: number | null, b?: number | null) =>
    a == null || b == null || b < 0 || a > values.length - 1 ? null : band(Math.max(0, a), Math.min(values.length - 1, b));
  const cmp = clip(compareFrom, compareTo);

  return (
    <figure className={s.profile}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Acumulado del club en km-esfuerzo, mes a mes">
        {cmp && <rect x={cmp.x} y={0} width={cmp.w} height={H} className={s.profileCompare} />}
        <rect x={sel.x} y={0} width={sel.w} height={H} className={s.profileBand} />
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={0} x2={W} y1={y(max * f)} y2={y(max * f)} className={s.profileGrid} />
        ))}
        <path d={area} className={s.profileArea} />
        <path d={line} className={s.profileLine} />
        {values.map((v, i) => (
          <circle key={i} cx={x(i)} cy={y(v)} r={i >= from && i <= to ? 4.5 : 3} className={i >= from && i <= to ? s.profileDotOn : s.profileDot} />
        ))}
        <text x={x(values.length - 1) - 6} y={y(values[values.length - 1]) - 12} textAnchor="end" className={s.profileSummit}>
          {Math.round(values[values.length - 1]).toLocaleString("es-ES")} km-esfuerzo
        </text>
      </svg>
      <div className={s.profileAxis} style={{ gridTemplateColumns: `repeat(${labels.length}, 1fr)` }}>
        {labels.map((l, i) => (
          <span key={l} data-on={i >= from && i <= to ? "" : undefined}>
            {l}
          </span>
        ))}
      </div>
    </figure>
  );
}

// Tiny monthly profile for each member row.
export function Spark({ values, from, to }: { values: number[]; from: number; to: number }) {
  const W = 120;
  const H = 30;
  const max = Math.max(1, ...values);
  const step = W / (values.length - 1);
  const pts = values.map((v, i) => [i * step, H - 2 - (v / max) * (H - 6)]);
  const d = pts.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`).join(" ");
  const hi = pts.slice(from, to + 1).map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={s.spark} aria-hidden="true">
      <path d={`${d} L${W} ${H} L0 ${H} Z`} className={s.sparkArea} />
      <path d={d} className={s.sparkLine} />
      <path d={hi} className={s.sparkHi} />
    </svg>
  );
}
