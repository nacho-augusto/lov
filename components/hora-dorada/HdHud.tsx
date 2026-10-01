"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { club } from "@/content";
import { scrollToId } from "@/lib/scroll";
import styles from "./hd.module.css";

export const CHAPTERS = [
  { id: "club", label: "I. El club" },
  { id: "temporada", label: "II. La temporada" },
  { id: "localizaciones", label: "III. Localizaciones" },
  { id: "reparto", label: "IV. Reparto" },
  { id: "casting", label: "V. Casting abierto" },
  { id: "creditos", label: "Créditos" },
];

// The page "runs" like a 90-minute film: scroll progress becomes a running timecode.
const RUNTIME = 90 * 60;
const tc = (s: number) =>
  [Math.floor(s / 3600), Math.floor((s % 3600) / 60), Math.floor(s % 60)].map((n) => String(n).padStart(2, "0")).join(":");

export function HdHud() {
  const [chapter, setChapter] = useState("Apertura");
  const [ticks, setTicks] = useState<number[]>([]);
  const fillRef = useRef<HTMLDivElement>(null);
  const tcRef = useRef<HTMLSpanElement>(null);

  // current chapter: the last section whose top has passed the middle of the screen
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-hd-chapter]"));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setChapter((e.target as HTMLElement).dataset.hdChapter ?? "");
        });
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  // progress bar, timecode and chapter ticks
  useEffect(() => {
    let max = 1;
    const measure = () => {
      max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setTicks(
        CHAPTERS.map((c) => {
          const el = document.getElementById(c.id);
          return el ? Math.min(1, (el.getBoundingClientRect().top + window.scrollY) / max) : 0;
        }),
      );
    };
    const onScroll = () => {
      const p = Math.min(1, Math.max(0, window.scrollY / max));
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${p})`;
      if (tcRef.current) tcRef.current.textContent = tc(p * RUNTIME);
    };
    measure();
    onScroll();
    const ro = new ResizeObserver(() => {
      measure();
      onScroll();
    });
    ro.observe(document.body);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <>
      <header className={styles.hudTop}>
        <a
          href="#apertura"
          onClick={(e) => {
            e.preventDefault();
            scrollToId("apertura", 0);
          }}
          aria-label={`${club.name}: volver al principio`}
          className="inline-flex"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- the logo must paint instantly */}
          <img src="/logo/logo-light.png" alt="" width={640} height={195} className="h-6 w-auto md:h-7" />
        </a>
        <p className={`${styles.mono} ${styles.hudChapter} hidden md:block`}>
          <b>Cap.</b> {chapter}
        </p>
        <Link href="/" className={`${styles.mono} ${styles.hudLink}`}>
          ← Versiones
        </Link>
      </header>

      <nav className={styles.scrubber} aria-label="Capítulos">
        <span ref={tcRef} className={`${styles.mono} ${styles.tc}`}>
          00:00:00
        </span>
        <div className={styles.scrubTrack}>
          <div ref={fillRef} className={styles.scrubFill} />
          {CHAPTERS.map((c, i) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              className={styles.scrubTick}
              style={{ left: `${(ticks[i] ?? 0) * 100}%` }}
              onClick={(e) => {
                e.preventDefault();
                scrollToId(c.id, 0);
              }}
            >
              <span className={`${styles.mono} ${styles.scrubLabel}`}>{c.label}</span>
            </a>
          ))}
        </div>
        <span className={`${styles.mono} text-[var(--hd-dim)]`}>{tc(RUNTIME)}</span>
      </nav>
    </>
  );
}
