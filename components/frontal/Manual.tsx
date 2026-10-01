"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { LUMEN_MODES, NIGHT_SOUNDS, TRAIL_TIPS, VEST, type Lumens } from "./data";
import { useHeadlamp } from "./HeadlampContext";
import f from "./frontal.module.css";
import s from "./manual.module.css";

// Same `sizes` as the hero, so the browser reuses the hero's already-downloaded plates.
const SIZES = "(min-aspect-ratio: 33/14) 100vw, 236vh";

/** Beam radius in the demo, as a fraction of the frame width, per mode. */
const DEMO_R: Record<Lumens, number> = { 100: 0.12, 300: 0.2, 600: 0.29, 1000: 0.43 };
const DEMO_I: Record<Lumens, number> = { 100: 0.72, 300: 0.92, 600: 1, 1000: 1 };

/** Chapter 02:10 — a field guide for a first night run. */
export function Manual() {
  return (
    <section id="manual" className={`${f.chapter} ${s.section}`} aria-labelledby="manual-title">
      <div className={f.wrap}>
        <header className={f.chHead}>
          <span className={f.chClock} aria-hidden="true">
            02:10
          </span>
          <h2 id="manual-title" className={f.chTitle}>
            Manual de la noche
          </h2>
          <p className={f.chLead}>
            Una guía de campo para tu primera nocturna: cuánta luz llevar, qué meter en el chaleco y cómo se
            lee un sendero a oscuras.
          </p>
        </header>

        <LumensDemo />

        <div className={s.pair}>
          <Vest />
          <section className={s.tips} aria-labelledby="tips-title">
            <h3 id="tips-title" className={s.blockTitle}>
              Leer el sendero
            </h3>
            <ul className={s.tipList}>
              {TRAIL_TIPS.map((t) => (
                <li key={t.title}>
                  <p className={s.tipTitle}>{t.title}</p>
                  <p className={s.tipBody}>{t.body}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <Sounds />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function LumensDemo() {
  const { lumens, setLumens } = useHeadlamp();
  const frameRef = useRef<HTMLDivElement>(null);
  const mode = LUMEN_MODES.find((m) => m.lm === lumens) ?? LUMEN_MODES[1];

  // the beam follows the pointer inside the frame (or the finger, on tap)
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let mx = 0.6;
    let my = 0.52;
    let tx = mx;
    let ty = my;
    let raf = 0;
    const write = () => {
      el.style.setProperty("--mx", `${(mx * 100).toFixed(2)}%`);
      el.style.setProperty("--my", `${(my * 100).toFixed(2)}%`);
    };
    const tick = () => {
      mx += (tx - mx) * 0.2;
      my += (ty - my) * 0.2;
      write();
      raf = Math.abs(tx - mx) + Math.abs(ty - my) > 0.0008 ? requestAnimationFrame(tick) : 0;
    };
    const aim = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      tx = Math.min(1, Math.max(0, (e.clientX - b.left) / b.width));
      ty = Math.min(1, Math.max(0, (e.clientY - b.top) / b.height));
      if (reduced) {
        mx = tx;
        my = ty;
        write();
      } else if (!raf) raf = requestAnimationFrame(tick);
    };
    write();
    el.addEventListener("pointermove", aim);
    el.addEventListener("pointerdown", aim);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", aim);
      el.removeEventListener("pointerdown", aim);
    };
  }, []);

  return (
    <section className={s.lumens} aria-labelledby="lumens-title">
      <div className={s.demoCol}>
        <div
          ref={frameRef}
          className={s.demo}
          style={
            {
              "--dr": `${DEMO_R[lumens] * 100}cqw`,
              "--di": DEMO_I[lumens],
            } as React.CSSProperties
          }
        >
          <div className={s.crop} aria-hidden="true">
            <Image src="/frontal/night-dark-v2.jpg" alt="" fill sizes={SIZES} quality={85} className={s.plate} />
          </div>
          <div className={s.lit} aria-hidden="true">
            <div className={s.crop}>
              <Image src="/frontal/night-lit-v2.jpg" alt="" fill sizes={SIZES} quality={85} className={s.plate} />
            </div>
          </div>
          <p className={s.readout} aria-live="polite">
            <span className={s.readoutLm}>{mode.lm} lm</span>
            <span className={s.readoutName}>Modo {mode.name.toLowerCase()}</span>
          </p>
        </div>
        <p className={s.demoNote}>
          <span className={f.onHover}>Mueve el ratón sobre la piedra.</span>
          <span className={f.onTouch}>Toca la imagen para apuntar.</span> El mismo modo cambia la luz de toda la
          página.
        </p>
      </div>

      <fieldset className={s.modes}>
        <legend className={f.srOnly}>Potencia del frontal</legend>
        <h3 id="lumens-title" className={s.blockTitle}>
          Cuánta luz
        </h3>
        <p className={s.modesIntro}>Más lúmenes, menos batería. Elige el modo según el terreno:</p>
        {LUMEN_MODES.map((m) => (
          <label key={m.lm} className={s.mode}>
            <input
              type="radio"
              name="lm-manual"
              value={m.lm}
              checked={lumens === m.lm}
              onChange={() => setLumens(m.lm)}
            />
            <span className={s.modeHead}>
              <span className={s.modeLm}>{m.lm} lm</span>
              <span className={s.modeName}>{m.name}</span>
            </span>
            <span className={s.modeNote}>{m.note}</span>
            <span className={s.autonomy} aria-hidden="true">
              <span style={{ transform: `scaleX(${m.autonomy})` }} />
            </span>
          </label>
        ))}
        <p className={s.autonomyKey} aria-hidden="true">
          Barra: autonomía relativa de la batería
        </p>
      </fieldset>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Vest() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const done = VEST.filter((v) => checked[v.id]).length;
  const all = done === VEST.length;

  return (
    <fieldset className={s.vest} data-all={all ? "1" : "0"}>
      <legend className={f.srOnly}>Lista de salida: en el chaleco</legend>
      <h3 className={s.blockTitle}>En el chaleco</h3>
      <p className={s.vestIntro}>Antes de salir, repasa. Marca lo que ya llevas.</p>
      <ul className={s.vestList}>
        {VEST.map((v) => (
          <li key={v.id}>
            <label className={s.check}>
              <input
                type="checkbox"
                checked={!!checked[v.id]}
                onChange={(e) => setChecked((c) => ({ ...c, [v.id]: e.target.checked }))}
              />
              <span className={s.box} aria-hidden="true" />
              <span className={s.checkText}>
                <span className={s.item}>{v.item}</span>
                <span className={s.why}>{v.why}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      <p className={s.vestStatus} aria-live="polite">
        {all ? "Todo en el chaleco. Nos vemos en la salida." : `${done} de ${VEST.length} en el chaleco`}
      </p>
    </fieldset>
  );
}

/* ------------------------------------------------------------------ */

/** A deterministic "sound track of the night": quiet noise with a peak at each sound. */
function waveform(): string {
  const n = NIGHT_SOUNDS.length;
  const peaks = NIGHT_SOUNDS.map((_, i) => ((i + 0.5) / n) * 1000);
  let a = 9;
  const rnd = () => {
    a = (a * 16807) % 2147483647;
    return a / 2147483647;
  };
  const pts: string[] = [];
  for (let x = 0; x <= 1000; x += 4) {
    let amp = 1.2 + rnd() * 2.2;
    for (const p of peaks) amp += 26 * Math.exp(-((x - p) ** 2) / 90);
    const y = 40 + (x % 8 === 0 ? -1 : 1) * amp * (0.55 + rnd() * 0.45);
    pts.push(`${x},${y.toFixed(1)}`);
  }
  return pts.join(" ");
}

const WAVE = waveform();

function Sounds() {
  return (
    <section className={s.sounds} aria-labelledby="sounds-title">
      <div className={s.soundsHead}>
        <h3 id="sounds-title" className={s.blockTitle}>
          Lo que se oye
        </h3>
        <p className={s.soundsIntro}>Con el frontal en modo grupo, la noche se escucha más que se ve.</p>
      </div>
      <svg className={s.wave} viewBox="0 0 1000 80" preserveAspectRatio="none" aria-hidden="true">
        <polyline points={WAVE} fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
      <ol className={s.soundList}>
        {NIGHT_SOUNDS.map((x) => (
          <li key={x.at}>
            <span className={s.soundAt}>{x.at}</span>
            <span className={s.soundWhat}>{x.what}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
