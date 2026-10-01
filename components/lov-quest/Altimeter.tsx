"use client";

import { useEffect, useRef } from "react";
import type { FrameName } from "./atlas";
import { AtlasSprite } from "./AtlasSprite";
import { classById } from "./classes";
import { pad, useSettings } from "./store";

const MAX = 2069;

/** Page-level HUD: scrolling the site climbs from the sea (0 m) to La Maroma (2.069 m). */
export function Altimeter() {
  const sprite = classById(useSettings().classId).sprite;
  const rootRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, window.scrollY / max));
      if (markRef.current) markRef.current.style.setProperty("--p", p.toFixed(4));
      if (numRef.current) numRef.current.textContent = pad(p * MAX, 4);
      // the title screen has its own HUD: the rail appears once you leave it
      rootRef.current?.classList.toggle("is-on", window.scrollY > window.innerHeight * 0.65);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="lq-alti" ref={rootRef} aria-hidden="true">
      <span className="lq-alti__top">2.069</span>
      <div className="lq-alti__rail" ref={markRef}>
        <span className="lq-alti__flag">
          <AtlasSprite name="flag0" scale={2} />
        </span>
        <span className="lq-alti__mark">
          <AtlasSprite name={`${sprite}_idle` as FrameName} scale={1} />
          <span className="lq-alti__num">
            <span ref={numRef}>0000</span> m
          </span>
        </span>
      </div>
      <span className="lq-alti__bottom">0 m</span>
    </div>
  );
}
