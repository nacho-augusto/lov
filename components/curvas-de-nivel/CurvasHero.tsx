"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { ridgePath } from "@/lib/mountain";
import { useReducedMotion } from "@/components/hooks/useReducedMotion";
import { heroLines } from "@/content/copy";

const VIEW_W = 1200;
const VIEW_H = 600;
const SUMMIT_M = 2069; // La Maroma

// Paper-cut ridge layers (back → front), each from the shared silhouette.
const ridges = [
  { id: "r-back", fill: "var(--sage)", t: "translate(0 150) scale(1 0.62)", parallax: -70 },
  { id: "r-mid", fill: "var(--stone)", t: "translate(0 78) scale(1 0.82)", parallax: -38 },
];

// Switchback climb route from trailhead up to the main summit (~600,108).
const CLIMB_D =
  "M 80 540 L 240 500 L 150 455 L 330 425 L 250 380 L 430 350 L 360 300 L 520 270 L 470 210 L 580 165 L 600 112";

// Horizontal contour strata, clipped to the mountain silhouette.
const CONTOUR_YS = Array.from({ length: 15 }, (_, i) => 150 + i * 30);

export function CurvasHero() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const altRef = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  const mountainD = ridgePath(VIEW_W, 560, { closed: true, topPad: 70 });

  useGSAP(
    () => {
      const runner = "#cv-runner";
      const body = "#cv-runner-body";

      if (reduced) {
        // Static finished state: runner at summit, contours drawn, sun up.
        gsap.set("#cv-sun", { y: -50 });
        gsap.set(".cv-contour", { strokeDashoffset: 0 });
        gsap.set(runner, { x: 600, y: 112 });
        gsap.set("#cv-flag", { opacity: 1, scale: 1 });
        if (altRef.current) altRef.current.textContent = String(SUMMIT_M);
        return;
      }

      gsap.set(".cv-contour", { strokeDashoffset: 1 });
      gsap.set("#cv-flag", { opacity: 0, scale: 0, transformOrigin: "bottom center" });
      gsap.set("#cv-sun", { y: 120 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          pin: sceneRef.current,
          anticipatePin: 1,
          onUpdate: (self) => {
            if (altRef.current) {
              altRef.current.textContent = String(
                Math.round(self.progress * SUMMIT_M),
              );
            }
            // Direction-aware facing: descending → runner turns around.
            gsap.set(body, { scaleX: self.direction === -1 ? -1 : 1 });
          },
        },
      });

      tl.to("#cv-sun", { y: -50, ease: "none" }, 0)
        .to(ridges.map((r) => `#cv-${r.id}`), { y: (i) => ridges[i].parallax, ease: "none" }, 0)
        .to(".cv-contour", { strokeDashoffset: 0, ease: "none", stagger: 0.02 }, 0)
        .to(
          runner,
          {
            motionPath: {
              path: "#cv-climb-path",
              align: "#cv-climb-path",
              autoRotate: true,
              alignOrigin: [0.5, 0.5],
            },
            ease: "none",
          },
          0,
        )
        .to("#cv-headline", { opacity: 0, y: -40, ease: "none" }, 0)
        .fromTo(
          "#cv-flag",
          { opacity: 0, scale: 0 },
          { opacity: 1, scale: 1, ease: "back.out(2)" },
          0.82,
        );
    },
    { scope: sceneRef, dependencies: [reduced] },
  );

  return (
    <section
      ref={wrapRef}
      aria-label="Escalada de la cresta"
      style={{ height: "300vh" }}
      className="relative bg-paper"
    >
      <div
        ref={sceneRef}
        className="relative flex h-screen w-full items-center justify-center overflow-hidden"
      >
        <svg
          aria-hidden
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="xMidYMax slice"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <clipPath id="cv-mtn-clip">
              <path d={mountainD} />
            </clipPath>
            <linearGradient id="cv-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fdfbf5" />
              <stop offset="1" stopColor="var(--paper-panel)" />
            </linearGradient>
          </defs>

          <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="url(#cv-sky)" />

          {/* Sun rising behind the peaks */}
          <g id="cv-sun">
            <path d="M 600 235 A 112 112 0 0 1 824 235 Z" fill="var(--orange)" opacity="0.92" />
          </g>

          {/* Parallax paper-cut ridges */}
          {ridges.map((r) => (
            <g key={r.id} id={`cv-${r.id}`} transform={r.t}>
              <path d={ridgePath(VIEW_W, 560, { closed: true, topPad: 70 })} fill={r.fill} opacity={0.55} />
            </g>
          ))}

          {/* Main mountain: silhouette + contour strata + snow caps */}
          <g>
            <path d={mountainD} fill="var(--paper)" stroke="var(--ink)" strokeWidth="2.5" strokeLinejoin="round" />
            <g clipPath="url(#cv-mtn-clip)">
              {CONTOUR_YS.map((y, i) => (
                <line
                  key={i}
                  className="cv-contour"
                  x1="0"
                  x2={VIEW_W}
                  y1={y}
                  y2={y}
                  stroke="var(--ink)"
                  strokeOpacity="0.18"
                  strokeWidth="1.5"
                  pathLength={1}
                  style={{ strokeDasharray: 1 }}
                />
              ))}
            </g>
            {/* small snow caps near the three summits */}
            <path d="M 588 108 L 600 92 L 614 110 Z" fill="var(--snow)" stroke="var(--ink)" strokeWidth="1.5" />
          </g>

          {/* Climb trail */}
          <path
            id="cv-climb-path"
            d={CLIMB_D}
            fill="none"
            stroke="var(--orange)"
            strokeWidth="2.5"
            strokeDasharray="2 7"
            strokeLinecap="round"
            opacity="0.7"
          />

          {/* Flag at the summit */}
          <g id="cv-flag" transform="translate(600 112)">
            <line x1="0" y1="0" x2="0" y2="-30" stroke="var(--ink)" strokeWidth="2.5" />
            <path d="M 0 -30 L 22 -24 L 0 -17 Z" fill="var(--orange)" />
          </g>

          {/* Runner marker (echoes the angular logo). Parent gets motion-path
              transform; inner body flips for descent. */}
          <g id="cv-runner">
            <g id="cv-runner-body">
              <circle cx="0" cy="0" r="11" fill="var(--orange)" stroke="var(--ink)" strokeWidth="2" />
              <path d="M -4 -2 L 3 -2 L -1 5 Z" fill="var(--ink)" />
            </g>
          </g>
        </svg>

        {/* Real DOM content over the scene */}
        <div id="cv-headline" className="relative z-10 max-w-3xl px-6 text-center">
          {/* legibility backing plate so the line-art never collides with type */}
          <div
            aria-hidden
            className="absolute -inset-x-12 -inset-y-8 -z-10 rounded-[50%] bg-paper/75 blur-2xl"
          />
          <p className="font-mono text-xs uppercase tracking-[0.32em] text-orange">
            {heroLines.curvasDeNivel.eyebrow}
          </p>
          <h1 className="mt-5 font-serif text-6xl leading-[0.95] text-ink sm:text-8xl">
            La otra
            <span className="block italic text-orange">vertiente</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-ink/70">
            {heroLines.curvasDeNivel.subtitle}
          </p>
          <p className="mt-10 font-mono text-xs uppercase tracking-[0.3em] text-ink/50">
            Haz scroll para escalar ↓
          </p>
        </div>

        {/* Altitude HUD */}
        <div className="pointer-events-none absolute bottom-8 right-6 z-10 text-right sm:right-10">
          <div className="font-mono text-xs uppercase tracking-widest text-ink/50">
            Altitud ganada
          </div>
          <div className="font-display text-5xl text-ink tabular sm:text-6xl">
            <span ref={altRef}>0</span>
            <span className="ml-1 text-2xl text-orange">m</span>
          </div>
        </div>
      </div>
    </section>
  );
}
