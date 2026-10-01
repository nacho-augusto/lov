"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HeadlampContext } from "./HeadlampContext";
import type { Lumens } from "./data";
import { Hud } from "./Hud";
import styles from "./frontal.module.css";

/**
 * Root of the Frontal page: holds the headlamp power (shared by every beam),
 * the warm light pool that follows the pointer across the whole night, and the HUD.
 */
export function FrontalShell({ children }: { children: React.ReactNode }) {
  const [lumens, setLumens] = useState<Lumens>(300);
  const value = useMemo(() => ({ lumens, setLumens }), [lumens]);

  return (
    <HeadlampContext.Provider value={value}>
      <div className={styles.root} data-lm={lumens}>
        {children}
        <LightPool />
        <Hud />
      </div>
    </HeadlampContext.Provider>
  );
}

/** A soft warm pool of light under the pointer (mouse/pen only). Transform-only. */
function LightPool() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;
    let raf = 0;
    let shown = false;

    const paint = () => {
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    };
    const loop = () => {
      x += (tx - x) * 0.2;
      y += (ty - y) * 0.2;
      paint();
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.4 ? requestAnimationFrame(loop) : 0;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      tx = e.clientX;
      ty = e.clientY;
      if (!shown) {
        shown = true;
        x = tx;
        y = ty;
        paint();
        el.dataset.on = "1";
      }
      if (reduced) {
        x = tx;
        y = ty;
        paint();
        return;
      }
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const onOut = (e: MouseEvent) => {
      if (!e.relatedTarget) {
        shown = false;
        el.dataset.on = "0";
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseout", onOut);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseout", onOut);
    };
  }, []);

  return <div ref={ref} className={styles.pool} aria-hidden="true" />;
}
