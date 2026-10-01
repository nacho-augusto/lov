"use client";

import { useEffect, useRef } from "react";
import { club } from "@/content";
import { STORY_NOTE } from "./data";
import { trackScroll } from "./track";
import s from "./amanecer.module.css";

// The club logo's ridge (same normalised points as lib/mountain's ridgePoints),
// redrawn here at horizon scale: 100 units wide → 760 px, centred in a 1440 x 400 scene.
const LOGO_RIDGE: [number, number][] = [
  [0.0, 0.9], [0.07, 0.74], [0.13, 0.82], [0.21, 0.5], [0.29, 0.68], [0.37, 0.55], [0.5, 0.06],
  [0.58, 0.4], [0.65, 0.26], [0.73, 0.5], [0.81, 0.36], [0.9, 0.64], [1.0, 0.72],
];
const X0 = 340;
const RW = 760;
const BASE = 392;
const TOP = BASE - 40 * 7.6; // 40 units of ridge height at 7.6 px/unit
const ridgeXY = LOGO_RIDGE.map(([x, y]) => [X0 + x * RW, TOP + y * (BASE - TOP)] as const);
const leftEnd = ridgeXY[0];
const rightEnd = ridgeXY[ridgeXY.length - 1];
const HORIZON = [
  `M0 ${BASE - 22}`,
  `L90 ${BASE - 40} L170 ${BASE - 30} L250 ${BASE - 46} L${leftEnd[0]} ${leftEnd[1]}`,
  ...ridgeXY.slice(1).map(([x, y]) => `L${x.toFixed(1)} ${y.toFixed(1)}`),
  `L${rightEnd[0] + 70} ${rightEnd[1] + 22} L1230 ${BASE - 60} L1320 ${BASE - 44} L1440 ${BASE - 56}`,
  `L1440 400 L0 400 Z`,
].join(" ");
// The logo's sun, rising behind the right-hand peaks (its final position is a bit
// higher than in the logo so it clearly clears the ridge at this scale).
const SUN = { cx: X0 + 0.775 * RW, cy: BASE - 70, r: 0.21 * RW };

/** Chapter 07:12 — dawn. The sky turns, the logo's sun rises, and the invitation appears. */
export function Amanecer() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.dataset.static = "1";
      el.dataset.cta = "1";
      el.style.setProperty("--p", "1");
      return;
    }
    return trackScroll(el, ({ top, height, scrollY, vh }) => {
      const p = Math.min(1, Math.max(0, (scrollY - top) / Math.max(1, height - vh)));
      el.style.setProperty("--p", p.toFixed(4));
      el.dataset.cta = p > (window.innerWidth <= 640 ? 0.66 : 0.5) ? "1" : "0";
    });
  }, []);

  return (
    <section id="amanecer" ref={ref} className={s.dawn} aria-labelledby="amanecer-title">
      {/* story-clock anchors for the HUD (06:41 last ramp, 07:12 sunrise) */}
      <span className={s.anchor} data-clock={30 * 60 + 41} style={{ top: "48vh" }} aria-hidden="true" />
      <span className={s.anchor} data-clock={31 * 60 + 12} style={{ top: "105vh" }} aria-hidden="true" />
      {/* where the HUD's "Amanecer" takes you: sun up, invitation fully visible */}
      <span id="amanecer-sol" className={s.anchor} style={{ top: "132vh" }} aria-hidden="true" />
      <div className={s.sticky}>
        <div className={`${s.sky} ${s.night}`} aria-hidden="true" />
        <div className={`${s.sky} ${s.pre}`} aria-hidden="true" />
        <div className={`${s.sky} ${s.day}`} aria-hidden="true" />
        <div className={s.stars} aria-hidden="true" />

        <div className={s.logWrap}>
          <p className={s.logNote}>{STORY_NOTE}</p>
          <ol className={s.log} aria-label="Bitácora del final de la subida (relato ilustrativo)">
            <li>
              <span className={s.logAt}>06:41</span> Última rampa.
            </li>
            <li>
              <span className={s.logAt}>06:58</span> Cima: 2.069 m.
            </li>
            <li>
              <span className={s.logAt}>07:12</span> Sale el sol. Apaga el frontal.
            </li>
          </ol>
        </div>

        <div className={s.cta}>
          <h2 id="amanecer-title" className={s.ctaTitle}>
            Nos vemos en la salida.
          </h2>
          <p className={s.ctaText}>
            Si te tira la montaña, de día o de noche, pásate por nuestro Instagram y escríbenos. No importa tu
            ritmo: importa que quieras subir.
          </p>
          <div className={s.ctaLinks}>
            <a href={club.instagram} target="_blank" rel="noopener noreferrer" className={s.primary}>
              <span className={s.linkLabel}>Síguenos en Instagram</span>
              <span className={s.linkValue}>{club.instagramHandle}</span>
            </a>
            {/* the club's address isn't confirmed yet (content/club.ts): secondary and flagged */}
            <a
              href={`mailto:${club.contactEmail}`}
              className={s.secondary}
              aria-label={`Correo del club: ${club.contactEmail} (dirección por confirmar)`}
            >
              <span className={s.linkLabel}>
                Correo <span className={s.tag}>por confirmar</span>
              </span>
              <span className={s.linkValue}>{club.contactEmail}</span>
            </a>
          </div>
        </div>

        <svg className={s.horizon} viewBox="0 0 1440 400" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
          <defs>
            <radialGradient id="dawn-glow">
              <stop offset="0" stopColor="#ffd9a8" stopOpacity="0.9" />
              <stop offset="0.35" stopColor="#ff8a3d" stopOpacity="0.45" />
              <stop offset="1" stopColor="#f26b1d" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="dawn-sun" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#ffb066" />
              <stop offset="0.7" stopColor="#f6782b" />
              <stop offset="1" stopColor="#f26b1d" />
            </radialGradient>
          </defs>
          <g className={s.sunGroup}>
            <circle className={s.glow} cx={SUN.cx} cy={SUN.cy} r={SUN.r * 3.2} fill="url(#dawn-glow)" />
            <circle cx={SUN.cx} cy={SUN.cy} r={SUN.r} fill="url(#dawn-sun)" />
          </g>
          <path d={HORIZON} className={s.ridge} />
        </svg>
      </div>
    </section>
  );
}
