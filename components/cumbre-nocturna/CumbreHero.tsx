"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { gsap, useGSAP } from "@/lib/gsap";
import { useWebGLSupport } from "@/components/hooks/useWebGLSupport";
import { MountainMark } from "@/components/shared/MountainMark";
import { heroLines } from "@/content/copy";
import type { ClimbProgress } from "./Scene";

const CumbreScene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center bg-ink">
      <div className="font-mono text-xs uppercase tracking-[0.3em] text-orange/70">
        Cargando la montaña…
      </div>
    </div>
  ),
});

const SUMMIT_M = 2069;
const h = heroLines.cumbreNocturna;

export function CumbreHero() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const altRef = useRef<HTMLSpanElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef<ClimbProgress>({ value: 0, dir: 1, vel: 0 });

  const webgl = useWebGLSupport();

  useGSAP(
    () => {
      if (webgl !== true) return; // fallback path: no scroll-driven scene

      // Intro reveal
      gsap.from(".cn-reveal", {
        y: 32,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        stagger: 0.12,
        delay: 0.2,
      });

      // Master climb trigger: pins the scene, drives the camera via progressRef.
      gsap.timeline({
        scrollTrigger: {
          trigger: wrapRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          pin: pinRef.current,
          anticipatePin: 1,
          onUpdate: (self) => {
            const p = self.progress;
            progressRef.current.value = p;
            progressRef.current.dir = self.direction;
            progressRef.current.vel = self.getVelocity();
            if (altRef.current) {
              altRef.current.textContent = Math.round(p * SUMMIT_M).toLocaleString(
                "es-ES",
              );
            }
            if (arrowRef.current) {
              arrowRef.current.textContent = self.direction === -1 ? "↓" : "↑";
            }
          },
        },
      });

      // Hero text recedes as the climb begins.
      gsap.to(overlayRef.current, {
        opacity: 0,
        y: -40,
        ease: "none",
        scrollTrigger: {
          trigger: wrapRef.current,
          start: "top top",
          end: "38% top",
          scrub: true,
        },
      });
    },
    { scope: pinRef, dependencies: [webgl] },
  );

  return (
    <section
      ref={wrapRef}
      aria-label="Ascenso a la cumbre"
      style={{ height: webgl === true ? "340vh" : "100vh" }}
      className="relative bg-ink"
    >
      <div
        ref={pinRef}
        className="relative flex h-screen w-full items-center justify-center overflow-hidden"
      >
        {/* While detecting WebGL, hold a neutral dark frame (matches the scene bg)
            so there is no jarring photo→3D swap. Photo only on true no-WebGL. */}
        {webgl === null && <div aria-hidden className="absolute inset-0 bg-ink" />}
        {webgl === true && (
          <div
            className="absolute inset-0 [animation:fadeIn_700ms_ease]"
            aria-hidden
          >
            <CumbreScene progressRef={progressRef} />
          </div>
        )}
        {webgl === false && (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundColor: "#07090c",
              backgroundImage:
                "url('/generated/hero-cumbre.jpg'), radial-gradient(70% 60% at 50% 85%, rgba(242,107,29,0.4), transparent 60%), radial-gradient(120% 90% at 50% 0%, #0a0e16, #07090c)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 grid place-items-center">
              <MountainMark className="h-40 w-auto opacity-90" mountain="var(--snow)" />
            </div>
            <div className="absolute inset-0 bg-ink/40" />
          </div>
        )}

        {/* Hero copy (real DOM) */}
        <div
          ref={overlayRef}
          className="relative z-10 max-w-3xl px-6 text-center text-snow"
        >
          <p className="cn-reveal font-mono text-xs uppercase tracking-[0.3em] text-orange [text-shadow:0_1px_12px_rgba(7,9,12,0.6)]">
            {h.eyebrow}
          </p>
          <h1 className="cn-reveal font-display mt-5 text-5xl uppercase leading-[0.92] [text-shadow:0_2px_30px_rgba(7,9,12,0.5)] sm:text-8xl">
            Corremos por la
            <span className="block text-orange">otra vertiente</span>
          </h1>
          <p className="cn-reveal mx-auto mt-6 max-w-xl text-lg text-snow/70 [text-shadow:0_1px_12px_rgba(7,9,12,0.6)]">
            {h.subtitle}
          </p>
          {webgl === true && (
            <p className="cn-reveal mt-10 font-mono text-xs uppercase tracking-[0.3em] text-snow/45">
              Haz scroll para escalar ↓
            </p>
          )}
        </div>

        {/* Altimeter HUD */}
        {webgl === true && (
          <div className="pointer-events-none absolute bottom-8 right-6 z-10 text-right sm:right-10">
            <div className="font-mono text-xs uppercase tracking-widest text-snow/50">
              Altitud <span ref={arrowRef}>↑</span>
            </div>
            <div className="font-display text-5xl tabular text-snow sm:text-6xl">
              <span ref={altRef}>0</span>
              <span className="ml-1 text-2xl text-orange">m</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
