"use client";

import { MountainMark } from "@/components/shared/MountainMark";
import { heroLines } from "@/content/copy";
import { SUMMIT_M } from "./types";

/**
 * Static, no-WebGL hero used when WebGL is unavailable or prefers-reduced-motion
 * is set. Looks intentional and complete: HUD framing + the logo mountain + a
 * fixed altimeter. All content is real DOM.
 */
export function VerticeFallbackHero() {
  const h = heroLines.vertice;
  return (
    <section className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-ink px-5 text-snow">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(70% 70% at 50% 50%, #000 30%, transparent 80%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 60%, rgba(242,107,29,0.18), transparent 70%)",
        }}
      />
      <MountainMark
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 h-[55%] w-auto -translate-x-1/2 opacity-30"
        mountain="var(--snow)"
        sun="var(--orange)"
      />

      <div className="relative z-10 max-w-3xl text-center">
        <p className="font-mono text-xs uppercase tracking-[0.32em] text-orange">
          {h.eyebrow}
        </p>
        <h1 className="font-display mt-5 text-7xl uppercase tracking-tight sm:text-9xl">
          {h.title}
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-snow/70">{h.subtitle}</p>
        <div className="mt-10 inline-flex items-baseline gap-2 rounded-xl border border-white/15 bg-ink/70 px-6 py-3 backdrop-blur">
          <span className="font-mono text-xs uppercase tracking-widest text-snow/50">
            Altímetro
          </span>
          <span className="font-display text-4xl tabular text-orange">
            {SUMMIT_M.toLocaleString("es-ES")}
          </span>
          <span className="text-xl text-snow/60">m</span>
        </div>
      </div>
    </section>
  );
}
