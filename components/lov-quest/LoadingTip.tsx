"use client";

import { useEffect, useRef, useState } from "react";

/** Between screens: a stepped "loading" bar and a trail tip, like old console games. */
export function LoadingTip({ next, tip }: { next: string; tip: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`lq-tip${on ? " is-on" : ""}`} role="note">
      <p className="lq-tip__load">
        <span>Cargando {next}</span>
        <span className="lq-tip__bar" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <i key={i} style={{ animationDelay: `${i * 70}ms` }} />
          ))}
        </span>
      </p>
      <p className="lq-tip__text">
        <strong>Consejo:</strong> {tip}
      </p>
    </div>
  );
}
