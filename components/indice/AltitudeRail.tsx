"use client";

import { useEffect, useRef } from "react";
import { fmtInt, summit, SUMMIT_M } from "./data";
import { subscribeProgress, toMetres, useFolios } from "./scroll";

/**
 * The signature: a hairline from 0 m (sea level, Rincón de la Victoria) to
 * 2.069 m (La Maroma) along the right edge. The club's orange sun rises on it
 * as you read; ticks mark where each chapter begins.
 */
export function AltitudeRail() {
  const trackRef = useRef<HTMLDivElement>(null);
  const sunRef = useRef<HTMLSpanElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const valueRef = useRef<HTMLSpanElement>(null);
  const folios = useFolios();

  useEffect(() => {
    let height = trackRef.current?.clientHeight ?? 0;
    let lastM = -1;
    const measure = () => {
      height = trackRef.current?.clientHeight ?? 0;
    };
    window.addEventListener("resize", measure);
    const unsub = subscribeProgress((p) => {
      if (sunRef.current) sunRef.current.style.transform = `translate3d(0, ${(-p * height).toFixed(2)}px, 0)`;
      if (fillRef.current) fillRef.current.style.transform = `scaleY(${p.toFixed(4)})`;
      const m = toMetres(p);
      if (m !== lastM && valueRef.current) {
        lastM = m;
        valueRef.current.textContent = `${fmtInt(m)} m`;
      }
      trackRef.current?.toggleAttribute("data-summit", p > 0.985);
    });
    return () => {
      window.removeEventListener("resize", measure);
      unsub();
    };
  }, []);

  return (
    <div className="ix-rail" aria-hidden="true">
      <span className="ix-rail__end ix-rail__end--top">
        {fmtInt(SUMMIT_M)}
        <span className="ix-rail__peak">{summit.name}</span>
      </span>
      <div className="ix-rail__track" ref={trackRef}>
        <span className="ix-rail__line" />
        <span className="ix-rail__fill" ref={fillRef} />
        {folios &&
          Object.entries(folios).map(([id, m]) => (
            <span key={id} className="ix-rail__tick" style={{ bottom: `${(m / SUMMIT_M) * 100}%` }} />
          ))}
        <span className="ix-rail__sun" ref={sunRef}>
          <span className="ix-rail__value" ref={valueRef}>
            0 m
          </span>
          <span className="ix-rail__dot" />
        </span>
      </div>
      <span className="ix-rail__end ix-rail__end--bottom">0</span>
    </div>
  );
}
