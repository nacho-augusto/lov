"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

type Mote = { x: number; y: number; r: number; vx: number; vy: number; a: number; tw: number; ph: number };

/** Specks of dust drifting through the low sun: a small 2D canvas, paused off-screen. */
export function Dust({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // one soft warm sprite, scaled per mote (much cheaper than per-frame gradients)
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = 64;
    const sctx = sprite.getContext("2d");
    if (!sctx) return;
    const g = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255, 236, 200, 1)");
    g.addColorStop(0.35, "rgba(255, 205, 140, 0.55)");
    g.addColorStop(1, "rgba(255, 180, 100, 0)");
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, 64, 64);

    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    let w = 0;
    let h = 0;
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const spawn = (anywhere: boolean): Mote => {
      const bokeh = Math.random() < 0.12;
      return {
        x: anywhere ? Math.random() : -0.05 + Math.random() * 0.4,
        y: anywhere ? Math.random() : 1.05,
        r: bokeh ? 6 + Math.random() * 10 : 1.2 + Math.random() * 2.6,
        vx: 0.004 + Math.random() * 0.012,
        vy: -(0.006 + Math.random() * 0.018),
        a: bokeh ? 0.08 + Math.random() * 0.1 : 0.25 + Math.random() * 0.5,
        tw: 0.6 + Math.random() * 1.6,
        ph: Math.random() * Math.PI * 2,
      };
    };
    const motes = Array.from({ length: w < 768 ? 26 : 56 }, () => spawn(true));

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);

    let t = 0;
    const tick = (_time: number, deltaMs: number) => {
      if (!visible || document.hidden) return;
      const dt = Math.min(deltaMs, 64) / 1000;
      t += dt;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < motes.length; i++) {
        const m = motes[i];
        m.x += m.vx * dt + Math.sin(t * 0.7 + m.ph) * 0.0004;
        m.y += m.vy * dt;
        if (m.y < -0.06 || m.x > 1.06) motes[i] = spawn(false);
        // brighter in the sunbeam (top-left of the frame)
        const beam = 1 - Math.min(1, Math.hypot(m.x - 0.08, (m.y - 0.15) * 1.4) / 1.15);
        ctx.globalAlpha = m.a * (0.3 + 0.7 * beam) * (0.65 + 0.35 * Math.sin(t * m.tw + m.ph));
        const s = m.r * 2;
        ctx.drawImage(sprite, m.x * w - m.r, m.y * h - m.r, s, s);
      }
      ctx.globalAlpha = 1;
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden />;
}
