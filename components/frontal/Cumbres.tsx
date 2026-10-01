"use client";

import { useState } from "react";
import { peaks, seasonEvents } from "@/content";
import { SKY_BAND, SKY_FIELD, SKY_LINES, SKY_STARS } from "./sky";
import f from "./frontal.module.css";
import s from "./cumbres.module.css";

// The sky is nudged up a little to leave room for the ridge.
const SHIFT = -24;
const W = 1000;
const H = 720;
const star = new Map(SKY_STARS.map((x) => [x.id, x]));

interface Figure {
  id: string;
  name: string;
  groups: string[];
  stars: string[];
  at: [number, number];
  note: string;
}

const FIGURES: Figure[] = [
  {
    id: "escorpio",
    name: "Escorpio",
    groups: ["escorpio"],
    stars: ["antares"],
    at: [622, 474],
    note: "Pegado al horizonte sur en las noches de verano. Su corazón rojo es Antares; la cola se esconde detrás de las crestas.",
  },
  {
    id: "sagitario",
    name: "Sagitario",
    groups: ["sagitario"],
    stars: [],
    at: [296, 452],
    note: "Tiene forma de tetera, y el «vapor» que sale del pitorro es el centro de la Vía Láctea.",
  },
  {
    id: "triangulo",
    name: "Triángulo de verano",
    groups: ["triangulo", "lira", "cisne", "aguila"],
    stars: ["vega", "deneb", "altair"],
    at: [338, 222],
    note: "Vega, Deneb y Altair: tres estrellas brillantes que dibujan el verano desde lo alto.",
  },
  {
    id: "arturo",
    name: "Arturo",
    groups: [],
    stars: ["arcturus"],
    at: [762, 206],
    note: "La estrella más brillante de las noches de verano, sin contar planetas. A medianoche ya baja hacia el oeste.",
  },
  {
    id: "via",
    name: "Vía Láctea",
    groups: [],
    stars: [],
    at: [408, 352],
    note: "Lejos de las luces de la costa se ve a simple vista: cruza el cielo desde Sagitario hasta el Cisne.",
  },
];

const BRIGHT_TINT: Record<string, string> = {
  antares: "#ffb08a",
  arcturus: "#ffd9a6",
  vega: "#e4eeff",
  deneb: "#eef3ff",
  altair: "#f4f6ff",
};

// The three summits, on a profile with true relative heights (0 m = bottom of the chart).
const SUMMITS = [
  { id: "pico-del-cielo", x: 170 },
  { id: "navachica", x: 500 },
  { id: "la-maroma", x: 830 },
] as const;
const yFor = (elev: number) => H - (elev / 2069) * 145;

const RIDGE_PTS: [number, number][] = [
  [0, 662], [45, 648], [95, 632], [140, 620], [170, yFor(1508)], [200, 624], [240, 640], [285, 652],
  [330, 646], [380, 628], [430, 608], [470, 597], [500, yFor(1832)], [530, 600], [575, 622], [620, 640],
  [665, 634], [710, 614], [760, 594], [800, 581], [830, yFor(2069)], [865, 588], [905, 606], [950, 624],
  [1000, 636],
];
const RIDGE_LINE = RIDGE_PTS.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y.toFixed(1)}`).join(" ");
const RIDGE_FILL = `${RIDGE_LINE} L${W} ${H} L0 ${H} Z`;
const BAND = SKY_BAND.map(([x, y]) => `${x},${y}`).join(" ");

const april = seasonEvents.find((e) => e.id === "nocturna-frigiliana");
const NIGHT_NOTE: Record<string, string> = {
  "pico-del-cielo": `${april?.dateLabel ?? "Abril 2026"}: aventura nocturna desde Frigiliana. En junio volvimos de día, con la bandera.`,
  navachica: `${april?.dateLabel ?? "Abril 2026"}: la misma aventura nocturna, hasta el techo de la Almijara.`,
  "la-maroma": "La clásica: salida nocturna en verano para coronar al amanecer.",
};

const fmtElev = (m: number) => `${Math.floor(m / 1000)}.${String(m % 1000).padStart(3, "0")} m`;

/** Chapter 03:40 — the summits we climb at night, under the real summer sky. */
export function Cumbres() {
  const [active, setActive] = useState("escorpio");
  const [peak, setPeak] = useState<string | null>(null);
  const fig = FIGURES.find((x) => x.id === active) ?? FIGURES[0];
  const activeGroups = new Set(fig.groups);
  const activeStars = new Set(fig.stars);

  return (
    <section id="cumbres" className={`${f.chapter} ${s.section}`} aria-labelledby="cumbres-title">
      <div className={f.wrap}>
        <header className={f.chHead}>
          <span className={f.chClock} aria-hidden="true">
            03:40
          </span>
          <h2 id="cumbres-title" className={f.chTitle}>
            Tres cumbres de noche
          </h2>
          <p className={f.chLead}>
            Navachica y el Pico del Cielo fueron la aventura nocturna de abril. La Maroma, el techo de Málaga, se
            sube de noche para coronar al amanecer. Arriba, esto es lo que hay sobre tu cabeza.
          </p>
        </header>
      </div>

      <div className={s.chartWrap}>
        <div className={s.chart} data-active={active}>
          <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} aria-hidden="true">
            <defs>
              <radialGradient id="cum-glow">
                <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
                <stop offset="1" stopColor="#fff" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="cum-lamp">
                <stop offset="0" stopColor="#fff8ec" stopOpacity="1" />
                <stop offset="0.25" stopColor="#ffd9a8" stopOpacity="0.8" />
                <stop offset="1" stopColor="#f26b1d" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="cum-ground" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#070a10" />
                <stop offset="1" stopColor="#05070a" />
              </linearGradient>
            </defs>

            <g transform={`translate(0 ${SHIFT})`}>
              <g className={s.band} data-on={active === "via" ? "1" : "0"}>
                <polyline points={BAND} strokeWidth="230" />
                <polyline points={BAND} strokeWidth="150" />
                <polyline points={BAND} strokeWidth="86" />
                <polyline points={BAND} strokeWidth="36" />
              </g>
              <g className={s.field}>
                {SKY_FIELD.map(([x, y, r, o], i) => (
                  <circle key={i} cx={x} cy={y} r={r * 0.9} opacity={o} />
                ))}
              </g>
              <g className={s.lines}>
                {Object.entries(SKY_LINES).map(([group, pairs]) => (
                  <g key={group} data-on={activeGroups.has(group) ? "1" : "0"}>
                    {pairs.map(([a, b]) => {
                      const A = star.get(a);
                      const B = star.get(b);
                      if (!A || !B) return null;
                      return <line key={`${a}-${b}`} x1={A.x} y1={A.y} x2={B.x} y2={B.y} />;
                    })}
                  </g>
                ))}
              </g>
              <g>
                {SKY_STARS.map((st) => {
                  const r = Math.max(0.95, 3.4 - st.mag * 0.85);
                  const on = activeStars.has(st.id);
                  return (
                    <g key={st.id}>
                      {st.mag < 1.6 && (
                        <circle
                          cx={st.x}
                          cy={st.y}
                          r={on ? 16 : 10}
                          fill="url(#cum-glow)"
                          opacity={on ? 0.9 : 0.45}
                          className={s.glow}
                        />
                      )}
                      <circle cx={st.x} cy={st.y} r={r} fill={BRIGHT_TINT[st.id] ?? "#fff6ea"} />
                    </g>
                  );
                })}
              </g>
            </g>

            {/* the ridge: the page's own night, with a moonlit rim */}
            <path d={RIDGE_FILL} fill="url(#cum-ground)" />
            <path d={RIDGE_LINE} fill="none" className={s.rim} />
            {SUMMITS.map((p) => {
              const elev = peaks.find((x) => x.id === p.id)?.elevation ?? 0;
              const y = yFor(elev);
              return (
                <g key={p.id} className={s.summit} data-on={peak === p.id ? "1" : "0"}>
                  <circle cx={p.x} cy={y - 3} r={peak === p.id ? 22 : 14} fill="url(#cum-lamp)" />
                  <circle cx={p.x} cy={y - 3} r="2.2" fill="#fff8ec" />
                </g>
              );
            })}
          </svg>

          {/* summit labels (HTML, so they stay readable at any size) */}
          {SUMMITS.map((p) => {
            const pk = peaks.find((x) => x.id === p.id);
            if (!pk) return null;
            return (
              <p
                key={p.id}
                className={s.summitLabel}
                style={{ left: `${(p.x / W) * 100}%`, top: `${((yFor(pk.elevation) + 20) / H) * 100}%` }}
                aria-hidden="true"
              >
                <span>{pk.name}</span>
                <span>{fmtElev(pk.elevation)}</span>
              </p>
            );
          })}

          {/* constellations you can point at */}
          <div className={s.skyButtons} role="group" aria-label="Qué se ve en el cielo">
            {FIGURES.map((x) => (
              <button
                key={x.id}
                type="button"
                className={s.skyLabel}
                style={{ left: `${(x.at[0] / W) * 100}%`, top: `${((x.at[1] + SHIFT) / H) * 100}%` }}
                aria-pressed={active === x.id}
                onMouseEnter={() => setActive(x.id)}
                onFocus={() => setActive(x.id)}
                onClick={() => setActive(x.id)}
              >
                {x.name}
              </button>
            ))}
          </div>

        </div>
        <p className={s.note} aria-live="polite">
          <span className={s.noteName}>{fig.name}</span>
          <span className={s.noteText}>{fig.note}</span>
        </p>
        <p className={s.caption}>
          Cielo calculado para el 15 de julio de 2026 a las 23:45, mirando al sur desde La Maroma. Perfil con las
          alturas reales de las tres cumbres.
        </p>
      </div>

      <div className={f.wrap}>
        <ol className={s.peaks}>
          {SUMMITS.map((p) => {
            const pk = peaks.find((x) => x.id === p.id);
            if (!pk) return null;
            return (
              <li
                key={pk.id}
                className={s.peak}
                onMouseEnter={() => setPeak(pk.id)}
                onMouseLeave={() => setPeak(null)}
              >
                <h3 className={s.peakName}>{pk.name}</h3>
                <p className={s.peakElev}>{fmtElev(pk.elevation)}</p>
                <dl className={s.peakFacts}>
                  <div>
                    <dt>Sierra</dt>
                    <dd>{pk.sierra}</dd>
                  </div>
                  <div>
                    <dt>Dificultad</dt>
                    <dd>{pk.difficulty}</dd>
                  </div>
                </dl>
                <p className={s.peakWhy}>{pk.why}</p>
                <p className={s.peakNight}>{NIGHT_NOTE[pk.id]}</p>
                <p className={s.peakRoute}>{pk.route}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
