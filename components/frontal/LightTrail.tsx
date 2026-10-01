"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./lighttrail.module.css";

type Variant = "frigiliana" | "jabega";

// Deterministic little star field for the drawings.
function stars(seed: number, n: number, maxY: number): [number, number, number][] {
  let a = seed;
  const rnd = () => {
    a = (a * 16807) % 2147483647;
    return a / 2147483647;
  };
  return Array.from({ length: n }, () => [
    Math.round(rnd() * 400),
    Math.round(rnd() * maxY),
    Math.round((0.4 + rnd() * 0.8) * 10) / 10,
  ]);
}

const FRIGILIANA = {
  ridge: "M0 330 L40 300 L80 252 L110 212 L140 240 L176 262 L210 202 L250 150 L292 192 L332 230 L372 258 L400 276",
  fill: "M0 330 L40 300 L80 252 L110 212 L140 240 L176 262 L210 202 L250 150 L292 192 L332 230 L372 258 L400 276 L400 500 L0 500 Z",
  trail:
    "M34 472 L72 446 L44 420 L88 396 L58 368 L98 344 L72 316 L104 284 L96 252 L110 214 L140 240 L176 262 L198 232 L214 212 L232 180 L250 152",
  stars: stars(11, 34, 230),
};

const JABEGA = {
  ridge: "M0 300 L58 262 L118 204 L168 168 L208 182 L258 150 L310 192 L360 230 L400 248",
  fill: "M0 300 L58 262 L118 204 L168 168 L208 182 L258 150 L310 192 L360 230 L400 248 L400 392 L0 392 Z",
  trail:
    "M30 404 L118 400 L140 372 L114 348 L158 322 L134 294 L176 266 L166 232 L206 196 L232 168 L258 152 L270 186 L244 214 L288 240 L262 270 L306 300 L286 334 L326 362 L338 400 L380 404",
  stars: stars(5, 30, 200),
};

/**
 * A night with no photo, drawn the way a headlamp would draw it in a long exposure.
 * The light trail draws itself the first time it scrolls into view.
 */
export function LightTrail({ variant, label }: { variant: Variant; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [drawn, setDrawn] = useState(false);
  const d = variant === "frigiliana" ? FRIGILIANA : JABEGA;
  const gid = `lt-${variant}`;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDrawn(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setDrawn(true);
          io.disconnect();
        }
      },
      { threshold: 0.45 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={styles.wrap} data-drawn={drawn ? "1" : "0"}>
      <svg viewBox="0 0 400 500" role="img" aria-label={label} className={styles.svg}>
        <defs>
          <linearGradient id={`${gid}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#05070a" />
            <stop offset="0.7" stopColor="#0c1728" />
            <stop offset="1" stopColor="#101d33" />
          </linearGradient>
          <linearGradient id={`${gid}-light`} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#ff8a3d" />
            <stop offset="0.45" stopColor="#ffd9a8" />
            <stop offset="1" stopColor="#fff4e0" />
          </linearGradient>
        </defs>
        <rect width="400" height="500" fill={`url(#${gid}-sky)`} />
        {d.stars.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill="#dfe7ff" opacity={0.25 + (i % 5) * 0.12} />
        ))}

        {variant === "frigiliana" ? (
          <path d="M338 58 a20 20 0 1 0 14 34 a16 16 0 1 1 -14 -34 Z" fill="#f4ecd8" opacity="0.85" />
        ) : (
          <g>
            {/* the sea, with the town's lights trembling on it */}
            {Array.from({ length: 9 }, (_, i) => (
              <line
                key={i}
                x1={10 + (i % 3) * 14}
                x2={390 - (i % 4) * 18}
                y1={418 + i * 9 + i * i * 0.6}
                y2={418 + i * 9 + i * i * 0.6}
                stroke="#9fb6d8"
                strokeOpacity={0.1 + i * 0.012}
                strokeDasharray={`${18 + i * 6} ${10 + i * 3}`}
              />
            ))}
            {Array.from({ length: 34 }, (_, i) => (
              <circle
                key={`t${i}`}
                cx={8 + i * 11.6 + (i % 3) * 2}
                cy={394 + (i % 4) * 3 - (i % 7 === 0 ? 6 : 0)}
                r={i % 5 === 0 ? 1.6 : 1.1}
                fill="#ffb35c"
                opacity={0.55 + (i % 4) * 0.12}
              />
            ))}
            {Array.from({ length: 10 }, (_, i) => (
              <line
                key={`r${i}`}
                x1={30 + i * 37}
                x2={30 + i * 37}
                y1={412}
                y2={432 + (i % 3) * 14}
                stroke="#ff9d4d"
                strokeOpacity="0.16"
                strokeWidth="1.4"
              />
            ))}
          </g>
        )}

        <path d={d.fill} fill="#070b11" />
        <path d={d.ridge} fill="none" stroke="#fff4e0" strokeOpacity="0.2" strokeWidth="1" />

        {/* the light trail: three strokes fake the glow without filters */}
        <g className={styles.trail} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={d.trail} pathLength={1} stroke="#ff8a3d" strokeOpacity="0.12" strokeWidth="11" />
          <path d={d.trail} pathLength={1} stroke="#ffd9a8" strokeOpacity="0.28" strokeWidth="4.5" />
          <path d={d.trail} pathLength={1} stroke={`url(#${gid}-light)`} strokeWidth="1.6" />
        </g>

        {variant === "frigiliana" ? (
          <g className={styles.labels}>
            <circle cx="110" cy="213" r="3.2" fill="#fff4e0" />
            <circle cx="250" cy="151" r="3.2" fill="#fff4e0" />
            <text x="96" y="186" textAnchor="end" className={styles.name}>
              Pico del Cielo
            </text>
            <text x="96" y="200" textAnchor="end" className={styles.alt}>
              1.508 m
            </text>
            <text x="262" y="126" className={styles.name}>
              Navachica
            </text>
            <text x="262" y="140" className={styles.alt}>
              1.832 m
            </text>
            <text x="34" y="492" className={styles.alt}>
              Frigiliana
            </text>
          </g>
        ) : (
          <g className={styles.labels}>
            <circle cx="258" cy="152" r="3.2" fill="#fff4e0" />
            <text x="270" y="140" className={styles.name}>
              Nuestra montaña
            </text>
            <text x="22" y="474" className={styles.name}>
              Nuestra playa
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
