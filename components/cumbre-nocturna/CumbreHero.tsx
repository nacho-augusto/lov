"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/components/hooks/useReducedMotion";
import { heroLines } from "@/content/copy";

const SUMMIT_M = 2069;
const h = heroLines.cumbreNocturna;

/**
 * Photographic "ascent": a real photo of La Maroma (nevada) is pinned full-screen
 * and, as you scroll, the camera zooms toward the summit while the valley fog clears,
 * a dawn glow grows and the altimeter climbs 0 → 2.069 m. Pure CSS/GSAP — no WebGL,
 * so it looks identical on every device.
 */
export function CumbreHero() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLImageElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const altRef = useRef<HTMLSpanElement>(null);
  const fogRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const summitRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const fmt = (n: number) => Math.round(n).toLocaleString("es-ES");

      if (reduced) {
        gsap.set(fogRef.current, { opacity: 0.2 });
        gsap.set(glowRef.current, { opacity: 0.25 });
        gsap.set(summitRef.current, { opacity: 1 });
        if (altRef.current) altRef.current.textContent = fmt(SUMMIT_M);
        return;
      }

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: wrapRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          pin: pinRef.current,
          anticipatePin: 1,
          onUpdate: (self) => {
            if (altRef.current)
              altRef.current.textContent = fmt(self.progress * SUMMIT_M);
          },
        },
      });

      tl.to(photoRef.current, { scale: 1.4, yPercent: -7, duration: 1 }, 0)
        .to(overlayRef.current, { opacity: 0, y: -40, duration: 0.32 }, 0)
        .to(fogRef.current, { opacity: 0, duration: 0.7 }, 0)
        .fromTo(glowRef.current, { opacity: 0 }, { opacity: 0.55, duration: 0.6 }, 0.42)
        .fromTo(
          summitRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.22 },
          0.72,
        );
    },
    { scope: pinRef, dependencies: [reduced] },
  );

  return (
    <section
      ref={wrapRef}
      aria-label="Ascenso a La Maroma"
      style={{ height: reduced ? "100vh" : "250vh" }}
      className="relative bg-ink"
    >
      <div
        ref={pinRef}
        className="relative flex h-screen w-full items-center justify-center overflow-hidden"
      >
        {/* The mountain */}
        <img
          ref={photoRef}
          src="/photos/maroma.jpg"
          alt="La Maroma nevada, el techo de Málaga"
          loading="eager"
          className="absolute inset-0 h-full w-full object-cover will-change-transform"
          style={{ transformOrigin: "52% 36%" }}
        />

        {/* valley fog (clears as you ascend) */}
        <div
          ref={fogRef}
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(225,232,238,0.85) 0%, rgba(210,220,230,0.35) 22%, transparent 45%)",
          }}
        />
        {/* dawn glow (grows near the summit) */}
        <div
          ref={glowRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0"
          style={{
            background:
              "radial-gradient(60% 50% at 60% 28%, rgba(242,107,29,0.55), transparent 70%)",
            mixBlendMode: "screen",
          }}
        />

        {/* scrims for nav + text legibility, and a soft vignette */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink/75 to-transparent" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent" />
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ boxShadow: "inset 0 0 220px rgba(7,9,12,0.7)" }} />

        {/* Summit label */}
        <div
          ref={summitRef}
          className="pointer-events-none absolute left-1/2 top-[24%] z-10 -translate-x-1/2 opacity-0"
        >
          <span className="whitespace-nowrap rounded-full border border-white/25 bg-ink/55 px-3 py-1 font-mono text-[0.7rem] uppercase tracking-widest text-snow backdrop-blur-sm">
            La Maroma · 2.069 m
          </span>
        </div>

        {/* Hero copy */}
        <div ref={overlayRef} className="relative z-10 max-w-3xl px-6 text-center text-snow">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-orange [text-shadow:0_1px_12px_rgba(7,9,12,0.7)]">
            {h.eyebrow}
          </p>
          <h1 className="font-display mt-5 text-5xl uppercase leading-[0.92] [text-shadow:0_2px_30px_rgba(7,9,12,0.6)] sm:text-8xl">
            Corremos por la
            <span className="block text-orange">otra vertiente</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-snow/80 [text-shadow:0_1px_12px_rgba(7,9,12,0.8)]">
            {h.subtitle}
          </p>
          {!reduced && (
            <p className="mt-10 font-mono text-xs uppercase tracking-[0.3em] text-snow/55">
              Haz scroll para escalar ↓
            </p>
          )}
        </div>

        {/* Altimeter */}
        <div className="pointer-events-none absolute bottom-8 right-6 z-10 text-right sm:right-10">
          <div className="font-mono text-xs uppercase tracking-widest text-snow/60">
            Altitud
          </div>
          <div className="font-display text-5xl tabular text-snow sm:text-6xl [text-shadow:0_2px_16px_rgba(7,9,12,0.7)]">
            <span ref={altRef}>0</span>
            <span className="ml-1 text-2xl text-orange">m</span>
          </div>
        </div>
      </div>
    </section>
  );
}
