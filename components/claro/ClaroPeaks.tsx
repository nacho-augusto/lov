import { peaks } from "@/content";
import type { Peak } from "@/content";
import { Reveal } from "./Reveal";
import styles from "./claro.module.css";

// Approximate west → east order across the province (the skyline is not to scale sideways).
const WEST_TO_EAST = [
  "torrecilla",
  "la-concha",
  "pico-mijas",
  "calamorro",
  "el-torcal",
  "pico-chamizo",
  "pico-de-la-reina",
  "la-maroma",
  "navachica",
  "pico-del-cielo",
];

const VB_W = 1600;
const VB_H = 640;
const SEA = 600; // y of 0 m
const PX_PER_M = 520 / 2100;
const y = (m: number) => SEA - m * PX_PER_M;

// Small deterministic jitter so the ridge looks natural and renders identically everywhere.
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

function ridgePath(points: { x: number; m: number }[], seed: number, saddle = 0.55) {
  const r = rng(seed);
  const pts: [number, number][] = [[0, y(points[0].m * 0.12)]];
  points.forEach((p, i) => {
    const next = points[i + 1];
    pts.push([p.x, y(p.m)]);
    if (!next) return;
    const low = Math.min(p.m, next.m) * (saddle + r() * 0.12);
    const xs = p.x + (next.x - p.x) * (0.42 + r() * 0.16);
    // shoulders on both slopes
    pts.push([p.x + (xs - p.x) * 0.38, y(p.m - (p.m - low) * (0.38 + r() * 0.12))]);
    pts.push([p.x + (xs - p.x) * 0.72, y(p.m - (p.m - low) * (0.78 + r() * 0.1))]);
    pts.push([xs, y(low)]);
    pts.push([xs + (next.x - xs) * 0.35, y(low + (next.m - low) * (0.3 + r() * 0.1))]);
    pts.push([xs + (next.x - xs) * 0.7, y(low + (next.m - low) * (0.66 + r() * 0.12))]);
  });
  pts.push([VB_W, y(points[points.length - 1].m * 0.4)]);
  return `M0 ${VB_H} ` + pts.map(([px, py]) => `L${px.toFixed(1)} ${py.toFixed(1)}`).join(" ") + ` L${VB_W} ${VB_H} Z`;
}

const ordered: Peak[] = WEST_TO_EAST.map((id) => peaks.find((p) => p.id === id)).filter(
  (p): p is Peak => Boolean(p),
);
// leave room on the left for the altitude guides
const X0 = 200;
const X1 = VB_W - 80;
const step = (X1 - X0) / (ordered.length - 1);
const summits = ordered.map((p, i) => ({ peak: p, x: X0 + i * step, m: p.elevation }));
const GUIDES = [1000, 1500, 2000];
const FRONT = ridgePath(summits, 7);
// a paler range behind, offset half a step, for depth
const BACK = ridgePath(
  summits.slice(0, -1).map((s, i) => ({ x: s.x + step / 2, m: Math.max(s.m, summits[i + 1].m) * 0.78 })),
  19,
  0.6,
);
const maroma = summits.find((s) => s.peak.id === "la-maroma");

const byHeight = [...peaks].sort((a, b) => b.elevation - a.elevation);
// es-ES leaves 4-digit numbers ungrouped; the club writes altitudes as "2.069 m".
const fmt = { format: (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".") };

export function ClaroPeaks() {
  return (
    <section id="cumbres" aria-labelledby="claro-peaks-title" className="relative overflow-hidden">
      <div className={`${styles.container} pt-[clamp(5rem,14vh,9rem)]`}>
        <div className="grid gap-10 md:grid-cols-12 md:items-end">
          <Reveal className="md:col-span-7">
            <p className={`${styles.eyebrow} text-[var(--c-orange-deep)]`}>Cumbres de Málaga</p>
            <h2 id="claro-peaks-title" className={`${styles.display} ${styles.h2} mt-4`}>
              Por encima
              <br />
              de las nubes
            </h2>
          </Reveal>
          <Reveal className="md:col-span-5" delay={120}>
            <p className={styles.lead}>
              Diez cimas que marcan nuestro horizonte, de la Sierra de las Nieves a la Almijara. Las de casa, las de la
              Axarquía, van en naranja.
            </p>
          </Reveal>
        </div>
      </div>

      <div className={styles.skylineScroller}>
        <div className={styles.peaksStage} role="img" aria-label="Perfil de las diez cumbres, de oeste a este, con La Maroma (2.069 m) como la más alta.">
          {maroma && (
            <div
              className={styles.peaksSun}
              style={{ left: `${(maroma.x / VB_W) * 100}%`, top: `${(y(maroma.m) / VB_H) * 100}%` }}
              aria-hidden
            />
          )}
          <svg className={styles.skyline} viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none" aria-hidden>
            {GUIDES.map((m) => (
              <line
                key={m}
                x1={0}
                x2={VB_W}
                y1={y(m)}
                y2={y(m)}
                stroke="#c9cfd5"
                strokeDasharray="3 7"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            <path d={BACK} fill="#d5dade" />
          </svg>
          <div className={`${styles.cloudBand} ${styles.cloudBandBack}`} aria-hidden>
            <div className={styles.cloudBandStrip} style={{ backgroundImage: "url(/heroes/claro/fog-mid.webp)" }} />
          </div>
          <svg className={styles.skyline} viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none" aria-hidden>
            {/* front range */}
            <defs>
              <linearGradient id="claro-ridge" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#262b31" />
                <stop offset="1" stopColor="#0d0f12" />
              </linearGradient>
            </defs>
            <path d={FRONT} fill="url(#claro-ridge)" />
          </svg>
          {/* the bases dissolve into a bank of cloud that becomes the page background */}
          <div className={styles.peaksMist} aria-hidden />
          <div className={`${styles.cloudBand} ${styles.cloudBandFront}`} aria-hidden>
            <div className={styles.cloudBandStrip} style={{ backgroundImage: "url(/heroes/claro/fog-near.webp)" }} />
          </div>

          {summits.map(({ peak, x, m }) => (
            <div
              key={peak.id}
              className={`${styles.summit} ${peak.home ? styles.summitHome : ""} ${
                peak.id === maroma?.peak.id ? styles.summitOnSun : ""
              }`}
              style={{ left: `${(x / VB_W) * 100}%`, top: `${(y(m) / VB_H) * 100}%` }}
              aria-hidden
            >
              <span className={styles.summitLabel}>
                <span className={`${styles.display} block text-[1.35rem]`}>{fmt.format(m)} m</span>
                <span className="block text-[0.7rem] font-semibold uppercase tracking-[0.14em]">{peak.name}</span>
              </span>
              <span className={styles.summitDot} />
            </div>
          ))}

          <div className={styles.altitudeAxis} aria-hidden>
            {GUIDES.map((m) => (
              <span key={m} style={{ top: `${(y(m) / VB_H) * 100}%` }}>
                {fmt.format(m)} m
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className={`${styles.container} mt-3 text-[0.8rem] text-[var(--c-stone)]`}>
        De oeste a este · altitudes a escala, distancias no
        <span className="md:hidden"> · desliza para ver el perfil completo</span>
      </p>

      <div className={`${styles.container} pb-[clamp(5rem,14vh,9rem)] pt-16`}>
        <ol className={styles.peakList}>
          {byHeight.map((p, i) => (
            <li key={p.id}>
              <Reveal className={styles.peakItem} delay={(i % 5) * 70}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className={`${styles.display} text-[2.6rem]`}>
                    {fmt.format(p.elevation)}
                    <span className="ml-1 text-[1.1rem] text-[var(--c-stone)]">m</span>
                  </p>
                  {p.home && <span className={`${styles.chip} ${styles.chipOrange}`}>Axarquía</span>}
                </div>
                <h3 className={`${styles.display} mt-1 text-[1.45rem]`}>{p.name}</h3>
                <p className="mt-1 text-[0.85rem] text-[var(--c-stone)]">
                  {p.sierra} · Dificultad {p.difficulty.toLowerCase()}
                </p>
                <p className="mt-3 text-[0.92rem] leading-relaxed text-[var(--c-ink-soft)]">{p.why}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
