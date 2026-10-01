"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { club, peaks, seasonEvents, type Peak } from "@/content";
import { PEAK_HAZARD } from "./copy";
import { Col, PAL } from "./palette";
import { playSfx } from "./sfx";
import { fmtInt, useSettings } from "./store";
import { dith, hash } from "./world";

const TOP = 2500; // metres at the top of the map frame
const STARS: Record<Peak["difficulty"], number> = { Media: 1, "Media-alta": 2, Alta: 3 };

interface Node {
  id: string;
  name: string;
  elevation: number;
  peak: Peak | null;
}

function visitsFor(p: Peak) {
  return seasonEvents.filter((e) => e.id === p.id || e.stats?.some((s) => s.label === p.name));
}

/** Pixel elevation-profile "world map" with hypsometric tints and contour lines. */
function drawMap(c: HTMLCanvasElement, W: number, H: number, pts: { x: number; y: number }[]) {
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(W, H);
  const d = img.data;
  const rgb = PAL.map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
  const set = (x: number, y: number, col: number) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 4;
    d[i] = rgb[col][0];
    d[i + 1] = rgb[col][1];
    d[i + 2] = rgb[col][2];
    d[i + 3] = 255;
  };
  const base = H - 6;
  const altToY = (m: number) => base - (m / TOP) * (base - 8);
  // ridge: through every node, with a valley between consecutive peaks
  const ridge = new Float32Array(W);
  for (let x = 0; x < W; x++) {
    let y = base;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      if (x >= a.x && x <= b.x) {
        const t = (x - a.x) / Math.max(1, b.x - a.x);
        const valley = Math.max(a.y, b.y) + (base - Math.max(a.y, b.y)) * 0.32;
        // two straight slopes meeting in the valley, slightly jagged
        const yy = t < 0.5 ? a.y + (valley - a.y) * (t / 0.5) : valley + (b.y - valley) * ((t - 0.5) / 0.5);
        y = yy;
      }
    }
    if (x > pts[pts.length - 1].x) {
      const last = pts[pts.length - 1];
      y = last.y + (x - last.x) * 1.1;
    }
    ridge[x] = Math.min(base, y + (hash(x, 5) > 0.82 ? 1 : 0));
  }
  const contour = (m: number) => Math.round(altToY(m));
  const contours = [250, 500, 750, 1000, 1250, 1500, 1750, 2000].map(contour);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const top = ridge[x];
      if (y < top) {
        // sky
        const t = y / H;
        set(x, y, dith(x, y, Math.round(Math.max(0, Math.min(16, (t - 0.25) * 22)))) ? Col.Mist : Col.Sky);
        continue;
      }
      const alt = ((base - y) / (base - 8)) * TOP;
      let col: number;
      if (alt < 40 && x < pts[1].x * 0.7) col = Col.Sea;
      else if (alt < 500) col = dith(x, y, Math.round(((alt - 300) / 200) * 16)) ? Col.Leaf : Col.Pine;
      else if (alt < 1000) col = dith(x, y, Math.round(((alt - 850) / 150) * 16)) ? Col.Sand : Col.Leaf;
      else if (alt < 1500) col = dith(x, y, Math.round(((alt - 1350) / 150) * 16)) ? Col.Stone : Col.Sand;
      else if (alt < 1850) col = dith(x, y, Math.round(((alt - 1750) / 100) * 16)) ? Col.Mist : Col.Stone;
      else col = Col.White;
      if (contours.includes(y) && y > top + 1 && (x + y) % 3 !== 0) {
        col = alt < 1000 ? Col.Pine : alt < 1850 ? Col.Dusk : Col.Stone;
        if (alt < 40 && x < pts[1].x * 0.7) col = Col.Sky;
      }
      if (y === Math.round(top)) col = alt > 1850 ? Col.Mist : Col.Ink;
      set(x, y, col);
    }
  }
  // sea sparkles + beach
  for (let x = 0; x < pts[1].x * 0.7; x++) {
    if (hash(x, 3) > 0.8) set(x, base - 3, Col.White);
  }
  ctx.putImageData(img, 0, 0);
  // dotted path along the nodes (white dashes, ink shadow)
  ctx.fillStyle = PAL[Col.Ink];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const n = Math.max(2, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / 3));
    for (let k = 1; k < n; k++) {
      if (k % 2) continue;
      const t = k / n;
      const x = Math.round(a.x + (b.x - a.x) * t);
      const y = Math.round(a.y + (b.y - a.y) * t) - 2;
      ctx.fillStyle = PAL[Col.Ink];
      ctx.fillRect(x, y + 1, 2, 1);
      ctx.fillStyle = PAL[Col.White];
      ctx.fillRect(x, y, 2, 1);
    }
  }
}

export function WorldMap() {
  const settings = useSettings();
  const nodes: Node[] = useMemo(
    () => [
      { id: "rincon", name: club.town, elevation: 0, peak: null },
      ...[...peaks].sort((a, b) => a.elevation - b.elevation).map((p) => ({ id: p.id, name: p.name, elevation: p.elevation, peak: p })),
    ],
    [],
  );
  const [sel, setSel] = useState(nodes.length - 1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const btns = useRef<(HTMLButtonElement | null)[]>([]);
  const [geo, setGeo] = useState<{ s: number; W: number; H: number; pts: { x: number; y: number }[] } | null>(null);

  // layout + draw (integer pixel scale)
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const draw = () => {
      const cssW = wrap.clientWidth;
      const s = cssW >= 900 ? 4 : cssW >= 560 ? 3 : 2;
      const W = Math.floor(cssW / s);
      const H = Math.round(W * (cssW >= 560 ? 0.36 : 0.62));
      const base = H - 6;
      const padL = Math.round(W * 0.07);
      const padR = Math.round(W * 0.05);
      const pts = nodes.map((n, i) => ({
        x: Math.round(padL + (i / (nodes.length - 1)) * (W - padL - padR)),
        y: Math.round(base - (n.elevation / TOP) * (base - 8)),
      }));
      drawMap(canvas, W, H, pts);
      canvas.style.width = `${W * s}px`;
      canvas.style.height = `${H * s}px`;
      setGeo({ s, W, H, pts });
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [nodes]);

  const choose = useCallback(
    (i: number, focus = false) => {
      const n = (i + nodes.length) % nodes.length;
      setSel(n);
      if (settings.sound) playSfx("menu");
      if (focus) btns.current[n]?.focus();
    },
    [nodes.length, settings.sound],
  );

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      choose(sel + 1, true);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      choose(sel - 1, true);
    } else if (e.key === "Home") {
      e.preventDefault();
      choose(0, true);
    } else if (e.key === "End") {
      e.preventDefault();
      choose(nodes.length - 1, true);
    }
  };

  const node = nodes[sel];
  const p = node.peak;
  const visits = p ? visitsFor(p) : [];
  const isBoss = p?.id === "la-maroma";
  const text = p
    ? `${p.why} Ruta: ${p.route}`
    : `Casilla de salida, a nivel del mar. ${club.region}. Desde aquí, todo es cuesta arriba: diez cumbres de Málaga entre los 771 y los 2.069 metros.`;

  return (
    <div className="lq-map">
      <div className="lq-frame lq-map__frame">
        <div className="lq-map__canvas" ref={wrapRef}>
          <canvas ref={canvasRef} aria-hidden="true" />
          {geo && (
            <>
              <ul className="lq-map__scale" aria-hidden="true">
                {[500, 1000, 1500, 2000].map((m) => (
                  <li key={m} style={{ top: Math.round((geo.H - 6 - (m / TOP) * (geo.H - 14)) * geo.s) }}>
                    {fmtInt(m)}
                  </li>
                ))}
              </ul>
              <div className="lq-map__nodes" role="radiogroup" aria-label="Niveles: cumbres de Málaga" onKeyDown={onKey}>
                {nodes.map((n, i) => {
                  const pt = geo.pts[i];
                  const on = i === sel;
                  const home = n.peak?.home;
                  const visited = n.peak ? visitsFor(n.peak).length > 0 : false;
                  const boss = n.peak?.id === "la-maroma";
                  return (
                    <button
                      key={n.id}
                      ref={(el) => {
                        btns.current[i] = el;
                      }}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      tabIndex={on ? 0 : -1}
                      aria-label={`${i === 0 ? "Salida" : `Nivel ${i}`}: ${n.name}, ${fmtInt(n.elevation)} metros${home ? ", Axarquía (casa)" : ""}${visited ? ", visitado en 2026" : ""}${boss ? ", jefe final" : ""}`}
                      className={`lq-node${on ? " is-on" : ""}${home ? " is-home" : ""}${visited ? " is-visited" : ""}${boss ? " is-boss" : ""}${i === 0 ? " is-start" : ""}`}
                      style={{ left: pt.x * geo.s, top: pt.y * geo.s }}
                      onClick={() => choose(i)}
                    >
                      <span className="lq-node__dot" aria-hidden="true">
                        {i === 0 ? "S" : boss ? "!" : i}
                      </span>
                      {on && (
                        <span className="lq-node__tag" aria-hidden="true">
                          {n.name}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
        <ul className="lq-map__legend" aria-label="Leyenda">
          <li>
            <i className="lq-node__dot lq-legend-home" aria-hidden="true" /> Casa: Axarquía
          </li>
          <li>
            <i className="lq-node__dot lq-legend-visit" aria-hidden="true" /> Visitado en 2026
          </li>
          <li>
            <i className="lq-node__dot lq-legend-boss" aria-hidden="true">
              !
            </i>{" "}
            Jefe final
          </li>
        </ul>
      </div>

      <div className="lq-map__panel" aria-live="polite">
        <div className="lq-frame lq-map__card">
          <p className="lq-map__kicker">
            {sel === 0 ? "Salida" : isBoss ? "Nivel 10 · Jefe final" : `Nivel ${String(sel).padStart(2, "0")}`}
          </p>
          <h3 className="lq-map__name">{node.name}</h3>
          <p className="lq-map__elev">
            <span className="lq-num">{fmtInt(node.elevation)}</span> <small>m</small>
          </p>
          {p ? (
            <dl className="lq-map__facts">
              <div>
                <dt>Sierra</dt>
                <dd>{p.sierra}</dd>
              </div>
              <div>
                <dt>Zona</dt>
                <dd>{p.area}</dd>
              </div>
              <div>
                <dt>Dificultad</dt>
                <dd>
                  <span className="lq-stars" aria-label={`${p.difficulty}: ${STARS[p.difficulty]} de 3`}>
                    {[0, 1, 2].map((k) => (
                      <i key={k} className={k < STARS[p.difficulty] ? "is-on" : undefined} />
                    ))}
                  </span>{" "}
                  {p.difficulty}
                </dd>
              </div>
            </dl>
          ) : (
            <dl className="lq-map__facts">
              <div>
                <dt>Base</dt>
                <dd>{club.name}</dd>
              </div>
            </dl>
          )}
          <p className="lq-map__badges">
            {p?.home && <span className="lq-badge lq-badge--home">Casa</span>}
            {visits.length > 0 && <span className="lq-badge lq-badge--visit">Visitado 2026</span>}
            {isBoss && <span className="lq-badge lq-badge--boss">Jefe final</span>}
            {sel === 0 && <span className="lq-badge">0 m · nivel del mar</span>}
          </p>
        </div>
        <div className="lq-frame lq-map__dialog">
          {p && <p className="lq-map__hazard">Peligro: {PEAK_HAZARD[p.id]}</p>}
          <Typewriter key={node.id} text={text} />
          {visits.length > 0 && (
            <ul className="lq-map__visits">
              {visits.map((e) => (
                <li key={e.id}>
                  <span className="lq-map__visit-date">{e.dateLabel}</span> {e.title}
                </li>
              ))}
            </ul>
          )}
          <div className="lq-map__hp" aria-label={`Desnivel desde el mar: ${fmtInt(node.elevation)} metros`}>
            <span className="lq-map__hp-k">Desnivel desde el mar</span>
            <span className="lq-map__hp-bar" aria-hidden="true">
              {Array.from({ length: 21 }, (_, k) => (
                <i key={k} className={k < Math.round((node.elevation / 2069) * 21) ? "is-on" : undefined} />
              ))}
            </span>
            <span className="lq-map__hp-n">+{fmtInt(node.elevation)} m</span>
          </div>
          <div className="lq-map__nav">
            <button type="button" className="lq-arrow" onClick={() => choose(sel - 1)} aria-label="Nivel anterior">
              <span aria-hidden="true" />
            </button>
            <span>
              {sel}/{nodes.length - 1}
            </span>
            <button type="button" className="lq-arrow" onClick={() => choose(sel + 1)} aria-label="Nivel siguiente">
              <span aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** RPG dialog text that types itself out (instant under reduced motion; full text always in the DOM). */
function Typewriter({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(text.length);
      return;
    }
    setN(0);
    let i = 0;
    const id = window.setInterval(() => {
      i += 2;
      setN(Math.min(text.length, i));
      if (i >= text.length) window.clearInterval(id);
    }, 18);
    return () => window.clearInterval(id);
  }, [text]);
  const done = n >= text.length;
  return (
    <p className="lq-type" onClick={() => setN(text.length)}>
      <span className="lq-sr">{text}</span>
      <span aria-hidden="true">
        {text.slice(0, n)}
        <span className="lq-type__ghost">{text.slice(n)}</span>
        {done && <span className="lq-type__caret" />}
      </span>
    </p>
  );
}
