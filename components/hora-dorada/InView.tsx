"use client";

import { useEffect, useRef } from "react";
import styles from "./hd.module.css";

/**
 * Plays an entrance once the block scrolls into view: `reveal` lifts it in,
 * `develop` brings its photo up from a dark, warm, blurred "undeveloped" state.
 * Rendered visible on the server; only blocks below the fold are hidden on mount.
 */
export function InView({
  children,
  className = "",
  mode = "reveal",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  mode?: "reveal" | "develop";
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    const [from, to] = mode === "develop" ? [styles.develop, styles.developIn] : [styles.reveal, styles.revealIn];
    el.classList.add(from);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.classList.add(to);
        io.disconnect();
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mode]);

  return (
    <div
      ref={ref}
      className={className}
      style={delay ? ({ "--d": `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
