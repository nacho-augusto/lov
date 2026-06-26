"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { useWebGLSupport } from "@/components/hooks/useWebGLSupport";
import { heroLines } from "@/content/copy";
import { VerticeFallbackHero } from "./VerticeFallbackHero";
import { SUMMIT_M, type VerticeProgress } from "./types";

const VerticeTerrain = dynamic(() => import("./VerticeTerrain"), { ssr: false });

export function VerticeHero() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const altRef = useRef<HTMLSpanElement>(null);
  const dirRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<VerticeProgress>({ p: 0, dir: 1, vel: 0 });

  const webgl = useWebGLSupport();
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    setDesktop(window.matchMedia("(min-width: 1024px)").matches);
  }, []);

  const interactive = webgl === true;

  useGSAP(
    () => {
      if (!interactive) return;
      const st = ScrollTrigger.create({
        trigger: wrapRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        pin: sceneRef.current,
        anticipatePin: 1,
        onUpdate: (self) => {
          const p = self.progress;
          progressRef.current.p = p;
          progressRef.current.dir = self.direction;
          progressRef.current.vel = self.getVelocity();
          if (altRef.current) {
            altRef.current.textContent = Math.round(p * SUMMIT_M).toLocaleString(
              "es-ES",
            );
          }
          if (dirRef.current) {
            const asc = self.direction >= 0;
            dirRef.current.textContent = asc ? "▲ ASCENSO" : "▼ DESCENSO";
            dirRef.current.style.color = asc ? "var(--orange)" : "var(--teal)";
          }
        },
      });

      // Hero copy recedes as the ascent begins, handing the frame to the terrain.
      const fade = gsap.to(copyRef.current, {
        opacity: 0,
        y: -30,
        ease: "none",
        scrollTrigger: {
          trigger: wrapRef.current,
          start: "top top",
          end: "32% top",
          scrub: true,
        },
      });

      return () => {
        st.kill();
        fade.scrollTrigger?.kill();
        fade.kill();
      };
    },
    { scope: sceneRef, dependencies: [interactive] },
  );

  if (!interactive) {
    return <VerticeFallbackHero />;
  }

  const h = heroLines.vertice;

  return (
    <section ref={wrapRef} style={{ height: "340vh" }} className="relative bg-ink">
      <div
        ref={sceneRef}
        className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-ink text-snow"
      >
        <VerticeTerrain progressRef={progressRef} desktop={desktop} />

        {/* HUD corner brackets */}
        <div aria-hidden className="pointer-events-none absolute inset-5 z-10 sm:inset-8">
          {["left-0 top-0 border-l-2 border-t-2", "right-0 top-0 border-r-2 border-t-2", "left-0 bottom-0 border-l-2 border-b-2", "right-0 bottom-0 border-r-2 border-b-2"].map(
            (c) => (
              <span key={c} className={`absolute h-6 w-6 border-orange/50 ${c}`} />
            ),
          )}
        </div>

        {/* Hero copy */}
        <div ref={copyRef} className="relative z-10 max-w-3xl px-6 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.32em] text-orange">
            {h.eyebrow}
          </p>
          <h1 className="font-display mt-5 text-7xl uppercase tracking-tight sm:text-9xl">
            {h.title}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-snow/75">{h.subtitle}</p>
          <p className="mt-10 font-mono text-xs uppercase tracking-[0.3em] text-snow/45">
            Haz scroll para ascender ↓
          </p>
        </div>

        {/* Altimeter + direction readout */}
        <div className="pointer-events-none absolute bottom-6 left-5 z-10 sm:left-8">
          <div className="font-mono text-[0.65rem] uppercase tracking-widest text-snow/45">
            Altímetro · La Maroma
          </div>
          <div className="font-display text-5xl tabular text-snow sm:text-6xl">
            <span ref={altRef}>0</span>
            <span className="ml-1 text-2xl text-orange">m</span>
          </div>
          <div
            ref={dirRef}
            className="mt-1 font-mono text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--orange)" }}
          >
            ▲ ASCENSO
          </div>
        </div>

        {/* Telemetry axis */}
        <div
          aria-hidden
          className="pointer-events-none absolute right-7 top-1/2 z-10 hidden -translate-y-1/2 flex-col items-end gap-3 font-mono text-[0.6rem] uppercase tracking-widest text-snow/35 sm:flex"
        >
          {["2069", "1500", "1000", "500", "0"].map((m) => (
            <div key={m} className="flex items-center gap-2">
              <span>{m} m</span>
              <span className="h-px w-5 bg-snow/25" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
