import { club, peaks, values, type Peak } from "@/content";
import { pad2, thousands } from "./format";
import { SectionHead } from "./SectionHead";
import s from "./dorsal.module.css";

// ---------------------------------------------------------------------------
// An imaginary ultra that strings together the ten peaks of our map, from sea
// level to La Maroma. Elevations are real; the terrain between them is drawn
// (deterministically) for illustration only.
// ---------------------------------------------------------------------------

type Key = { t: number; e: number; kind: "start" | "peak" | "valley"; peak?: Peak };
type Pt = { t: number; e: number };

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const course = [...peaks].sort((a, b) => a.elevation - b.elevation);
const roof = course[course.length - 1];
const E_MAX = 2200;

function buildCourse() {
  const r = mulberry32(2069);
  const n = course.length;
  const T0 = 0.075;
  const T1 = 0.985;
  const keys: Key[] = [{ t: 0, e: 0, kind: "start" }];
  course.forEach((p, i) => {
    const t = T0 + (i * (T1 - T0)) / (n - 1);
    if (i > 0) {
      const prev = keys[keys.length - 1];
      const lower = Math.min(prev.e, p.elevation);
      keys.push({
        t: (prev.t + t) / 2 + (r() - 0.5) * 0.018,
        e: lower * (0.42 + r() * 0.22),
        kind: "valley",
      });
    }
    keys.push({ t, e: p.elevation, kind: "peak", peak: p });
  });

  const pts: Pt[] = [];
  for (let k = 0; k < keys.length - 1; k++) {
    const a = keys[k];
    const b = keys[k + 1];
    const steps = 14;
    for (let j = 0; j < steps; j++) {
      const u = j / steps;
      const smooth = u * u * (3 - 2 * u);
      let e = a.e + (b.e - a.e) * smooth;
      const amp = Math.abs(b.e - a.e) * 0.075 + 22;
      e += (r() - 0.5) * 2 * amp * Math.sin(Math.PI * u);
      e = Math.max(0, Math.min(e, Math.max(a.e, b.e) - 10));
      pts.push({ t: a.t + (b.t - a.t) * u, e: j === 0 ? a.e : e });
    }
  }
  const last = keys[keys.length - 1];
  pts.push({ t: last.t, e: last.e });
  // finish line: a short summit plateau to the right edge
  pts.push({ t: 1, e: last.e - 30 });
  return { keys, pts };
}

const { keys, pts } = buildCourse();
const valleys = keys.filter((k) => k.kind === "valley");
// Aid stations ("avituallamientos") are the club values, every second valley.
const aidStations = [1, 3, 5, 7].map((vi, i) => ({ key: valleys[vi], value: values[i], n: i + 1 }));

function splitName(name: string): string[] {
  if (name.length <= 9) return [name];
  const words = name.split(" ");
  let best: [string, string] = [name, ""];
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const l = words.slice(0, i).join(" ");
    const rr = words.slice(i).join(" ");
    const diff = Math.abs(l.length - rr.length);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = [l, rr];
    }
  }
  return best[1] ? best : [name];
}

function geometry(W: number, H: number, pad: { l: number; r: number; t: number; b: number }) {
  const PB = H - pad.b;
  const k = (PB - pad.t) / E_MAX;
  const X = (t: number) => pad.l + t * (W - pad.l - pad.r);
  const Y = (e: number) => PB - e * k;
  const ridge = pts.map((p, i) => `${i ? "L" : "M"}${X(p.t).toFixed(1)} ${Y(p.e).toFixed(1)}`).join(" ");
  const mass = `${ridge} L${X(1).toFixed(1)} ${PB} L${X(0).toFixed(1)} ${PB} Z`;
  return { X, Y, PB, ridge, mass };
}

function WideProfile() {
  const W = 1400;
  const H = 700;
  const pad = { l: 92, r: 18, t: 116, b: 150 };
  const { X, Y, PB, ridge, mass } = geometry(W, H, pad);
  const peakKeys = keys.filter((k) => k.kind === "peak");

  return (
    <svg
      className={s.profileWide}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-labelledby="perfil-svg-title"
    >
      <title id="perfil-svg-title">{`Perfil de una carrera imaginaria: del nivel del mar en ${club.town} a los ${thousands(roof.elevation)} m de ${roof.name}, pasando por diez cumbres de Málaga.`}</title>

      {/* altitude grid */}
      {[0, 500, 1000, 1500, 2000].map((e) => (
        <g key={e}>
          <line x1={pad.l} x2={W - pad.r} y1={Y(e)} y2={Y(e)} className={s.pGrid} />
          <text x={pad.l - 14} y={Y(e) + 5} textAnchor="end" className={s.pAxis}>
            {thousands(e)}
          </text>
        </g>
      ))}
      <text x={pad.l - 14} y={Y(2000) - 22} textAnchor="end" className={s.pAxisUnit}>
        m
      </text>

      {/* the mountain */}
      <path d={mass} className={s.pMass} />
      <path d={ridge} className={s.pRidge} />

      {/* aid stations */}
      {aidStations.map(({ key, value, n }) => {
        const x = X(key.t);
        const y = Y(key.e);
        return (
          <g key={n}>
            <line x1={x} x2={x} y1={y + 16} y2={PB} className={s.pAidLine} />
            <circle cx={x} cy={y} r={15} className={s.pAidDot} />
            <path
              transform={`translate(${x - 8} ${y - 8}) scale(0.667)`}
              d="M4 3h16l-2.2 18H6.2L4 3Zm2.3 2 .5 4h10.4l.5-4H6.3Z"
              className={s.pAidCup}
            />
            <text x={x} y={PB + 36} textAnchor="middle" className={s.pAidNo}>
              AV{n}
            </text>
            <text x={x} y={PB + 58} textAnchor="middle" className={s.pAidName}>
              {value.title.split(" ")[0]}
            </text>
          </g>
        );
      })}

      {/* summits */}
      {peakKeys.map((k, i) => {
        const p = k.peak!;
        const x = X(k.t);
        const y = Y(k.e);
        const lines = splitName(p.name);
        const anchor = i === peakKeys.length - 1 ? "end" : "middle";
        const lx = i === peakKeys.length - 1 ? x + 6 : x;
        const nameBase = y - 40;
        const firstLine = nameBase - (lines.length - 1) * 21;
        return (
          <g key={p.id}>
            <line x1={x} x2={x} y1={y - 3} y2={y - 13} className={s.pTick} />
            {p.home && <circle cx={x} cy={y} r={6} className={s.pHome} />}
            <text x={lx} y={firstLine - 27} textAnchor={anchor} className={s.pCp}>
              CP{pad2(i + 1)}
              {p.home ? " · casa" : ""}
            </text>
            {lines.map((ln, j) => (
              <text key={ln} x={lx} y={firstLine + j * 21} textAnchor={anchor} className={s.pName}>
                {ln}
              </text>
            ))}
            <text x={lx} y={y - 18} textAnchor={anchor} className={s.pElev}>
              {thousands(p.elevation)} m
            </text>
          </g>
        );
      })}

      {/* start / finish */}
      <line x1={X(0)} x2={X(0)} y1={PB} y2={PB + 92} className={s.pStartLine} />
      <text x={X(0) + 10} y={PB + 84} className={s.pStart}>
        Salida
      </text>
      <text x={X(0) + 10} y={PB + 108} className={s.pStartSub}>
        0 m · {club.town}
      </text>
      <text x={X(1)} y={PB + 84} textAnchor="end" className={s.pStart}>
        Meta
      </text>
      <text x={X(1)} y={PB + 108} textAnchor="end" className={s.pStartSub}>
        {thousands(roof.elevation)} m · {roof.name}
      </text>
      <text x={(X(0) + X(1)) / 2} y={PB + 130} textAnchor="middle" className={s.pDist}>
        Distancia: la que haga falta
      </text>
    </svg>
  );
}

function CompactProfile() {
  const W = 400;
  const H = 300;
  const pad = { l: 40, r: 8, t: 46, b: 44 };
  const { X, Y, PB, ridge, mass } = geometry(W, H, pad);
  const peakKeys = keys.filter((k) => k.kind === "peak");
  return (
    <svg
      className={s.profileCompact}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-labelledby="perfil-svg-title-c"
    >
      <title id="perfil-svg-title-c">{`Perfil de una carrera imaginaria: del nivel del mar a los ${thousands(roof.elevation)} m de ${roof.name}, pasando por diez cumbres de Málaga.`}</title>
      {[0, 1000, 2000].map((e) => (
        <g key={e}>
          <line x1={pad.l} x2={W - pad.r} y1={Y(e)} y2={Y(e)} className={s.pGrid} />
          <text x={pad.l - 6} y={Y(e) + 4} textAnchor="end" className={s.pAxisC}>
            {thousands(e)}
          </text>
        </g>
      ))}
      <path d={mass} className={s.pMass} />
      <path d={ridge} className={s.pRidge} />
      {aidStations.map(({ key, n }) => (
        <circle key={n} cx={X(key.t)} cy={Y(key.e)} r={5.5} className={s.pAidDot} />
      ))}
      {peakKeys.map((k, i) => (
        <text key={k.peak!.id} x={X(k.t)} y={Y(k.e) - 9} textAnchor="middle" className={s.pNumC}>
          {i + 1}
        </text>
      ))}
      <text x={X(0)} y={PB + 22} className={s.pStartC}>
        Salida · 0 m
      </text>
      <text x={X(1)} y={PB + 22} textAnchor="end" className={s.pStartC}>
        Meta · {thousands(roof.elevation)} m
      </text>
    </svg>
  );
}

/** 03 — The course profile, from the beach to the roof of Málaga. */
export function Perfil() {
  return (
    <section id="perfil" className={s.perfil} aria-labelledby="perfil-title">
      <SectionHead id="perfil" title="Perfil" fit={4.56} note="Del mar a los 2.069 m · Recorrido imaginario" />

      <div className={s.perfilBody}>
        <div className={s.chartWrap}>
          <WideProfile />
          <CompactProfile />
          <p className={s.chartNote}>
            <span className={s.chartNoteLabel}>Nota técnica</span>
            Las diez cumbres de nuestro mapa, encadenadas de menor a mayor altitud en una sola carrera.
            Altitudes reales; el terreno entre cumbres es ilustrativo. Los avituallamientos llevan el
            nombre de nuestros valores.
          </p>
        </div>

        <ul className={s.aidLegend} aria-label="Avituallamientos">
          {aidStations.map(({ value, n }) => (
            <li key={n} className={s.aidItem}>
              <span className={s.aidNo}>AV{n}</span>
              <span className={s.aidName}>{value.title}</span>
            </li>
          ))}
        </ul>

        <h3 className={s.ctrlTitle}>Relación de controles</h3>
        <ol className={s.ctrlList}>
          {course.map((p, i) => (
            <li key={p.id} className={`${s.ctrl} ${p.home ? s.ctrlHome : ""}`}>
              <span className={s.ctrlCp}>CP{pad2(i + 1)}</span>
              <span className={s.ctrlName}>{p.name}</span>
              <span className={s.ctrlElev}>{thousands(p.elevation)} m</span>
              <span className={s.ctrlWhere}>
                {p.sierra} · {p.area}
              </span>
              <span className={s.ctrlDiff}>
                Dificultad {p.difficulty.toLowerCase()}
                {p.home ? " · En casa" : ""}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
