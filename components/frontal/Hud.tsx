"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { scrollToId } from "@/lib/scroll";
import { CHAPTERS, CLOCK_START, CLOCK_SUMMIT, CLOCK_SUNRISE, END_MIN, LUMEN_MODES, clock } from "./data";
import { useHeadlamp } from "./HeadlampContext";
import styles from "./hud.module.css";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
/** Spanish thousands separator ("2.069 m"), applied even to 4-digit figures. */
const fmtMeters = (m: number) =>
  m >= 1000 ? `${Math.floor(m / 1000)}.${String(m % 1000).padStart(3, "0")} m` : `${m} m`;

/**
 * The night's instrument panel. The clock advances with the scroll (a story
 * clock); altitude and battery follow that clock (sea level → La Maroma at the
 * summit, battery drained by sunrise). Chapter hours double as anchors.
 */
export function Hud() {
  const { lumens, setLumens } = useHeadlamp();
  const [active, setActive] = useState(0);
  const [day, setDay] = useState(false);
  const [open, setOpen] = useState(false);

  const navRef = useRef<HTMLElement>(null);
  const clockEls = useRef<(HTMLElement | null)[]>([]);
  const altEl = useRef<HTMLSpanElement>(null);
  const battEls = useRef<(HTMLElement | null)[]>([]);
  const battFill = useRef<(HTMLElement | null)[]>([]);
  const markerEl = useRef<HTMLSpanElement>(null);
  const activeRef = useRef(0);
  const dayRef = useRef(false);
  const bootRef = useRef(false);
  const [boot, setBoot] = useState(false);

  useEffect(() => {
    let tops: number[] = [];
    let anchors: { top: number; min: number }[] = [];
    let dayTop = Infinity;
    let raf = 0;
    const root = navRef.current?.closest<HTMLElement>("[data-lm]") ?? null;
    const docTop = (el: Element | null) => (el ? el.getBoundingClientRect().top + window.scrollY : 0);

    const measure = () => {
      tops = CHAPTERS.map((c) => docTop(document.getElementById(c.id)));
      // the clock runs through every chapter start plus finer milestones ([data-clock])
      anchors = [
        ...CHAPTERS.filter((c) => !c.target).map((c, j) => ({ top: j === 0 ? 0 : docTop(document.getElementById(c.id)), min: c.min })),
        ...Array.from(document.querySelectorAll<HTMLElement>("[data-clock]")).map((el) => ({
          top: docTop(el),
          min: Number(el.dataset.clock),
        })),
      ].sort((a, b) => a.top - b.top);
      dayTop = docTop(document.getElementById("dia")) || Infinity;
    };

    const update = () => {
      raf = 0;
      if (!tops.length) return;
      const vh = window.innerHeight;
      const y = window.scrollY;
      const maxY = Math.max(1, document.documentElement.scrollHeight - vh);
      // a milestone is reached when it gets to 42% of the viewport
      const trig = (t: number) => (t <= 0 ? 0 : Math.max(1, t - vh * 0.42));

      // story clock
      let a = 0;
      while (a < anchors.length - 1 && y >= trig(anchors[a + 1].top)) a++;
      const lastA = a === anchors.length - 1;
      const y0 = trig(anchors[a].top);
      const y1 = lastA ? Math.max(y0 + 1, maxY) : trig(anchors[a + 1].top);
      const m0 = anchors[a].min;
      const m1 = lastA ? END_MIN : anchors[a + 1].min;
      const min = m0 + (m1 - m0) * clamp01((y - y0) / Math.max(1, y1 - y0));
      const t = clock(min);
      for (const el of clockEls.current) if (el && el.textContent !== t) el.textContent = t;

      // altitude (sea level → La Maroma at the summit time) and battery (drains until sunrise)
      const alt = 2069 * easeInOut(clamp01((min - CLOCK_START) / (CLOCK_SUMMIT - CLOCK_START)));
      const pct = Math.round(100 - 91 * clamp01((min - CLOCK_START) / (CLOCK_SUNRISE - CLOCK_START)));
      if (altEl.current) altEl.current.textContent = fmtMeters(Math.round(alt));
      for (const el of battEls.current) if (el) el.textContent = `${pct} %`;
      for (const el of battFill.current) if (el) el.style.transform = `scaleX(${(pct / 100).toFixed(3)})`;
      const low = pct < 20 ? "1" : "0";
      if (navRef.current && navRef.current.dataset.low !== low) navRef.current.dataset.low = low;

      // active chapter + "you" on the rail
      let i = 0;
      while (i < tops.length - 1 && y >= trig(tops[i + 1])) i++;
      if (markerEl.current) {
        const last = i === tops.length - 1;
        const f = last ? 0 : clamp01((y - trig(tops[i])) / Math.max(1, trig(tops[i + 1]) - trig(tops[i])));
        const k = (i + f) / (CHAPTERS.length - 1);
        markerEl.current.style.transform = `translate3d(0, ${(k * 100).toFixed(2)}%, 0)`;
      }
      if (i !== activeRef.current) {
        activeRef.current = i;
        setActive(i);
      }

      // the instruments boot up once you leave the start line (the hero)
      const booted = y > vh * 0.55;
      if (booted !== bootRef.current) {
        bootRef.current = booted;
        setBoot(booted);
      }
      const isDay = y + vh * 0.55 > dayTop;
      if (isDay !== dayRef.current) {
        dayRef.current = isDay;
        setDay(isDay);
        if (root) root.dataset.day = isDay ? "1" : "0";
      }
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const remeasure = () => {
      measure();
      schedule();
    };

    remeasure();
    const ro = new ResizeObserver(remeasure);
    const main = document.getElementById("frontal-main");
    if (main) ro.observe(main);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", remeasure);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", remeasure);
    };
  }, []);

  // Escape closes the mobile sheet.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const go = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setOpen(false);
    scrollToId(id, 0);
  }, []);

  const cycle = useCallback(() => {
    const i = LUMEN_MODES.findIndex((m) => m.lm === lumens);
    setLumens(LUMEN_MODES[(i + 1) % LUMEN_MODES.length].lm);
  }, [lumens, setLumens]);

  const modeName = LUMEN_MODES.find((m) => m.lm === lumens)?.name ?? "";

  return (
    <nav
      ref={navRef}
      className={styles.hud}
      data-day={day ? "1" : "0"}
      data-boot={boot ? "1" : "0"}
      aria-label="Capítulos de la noche"
    >
      {/* ---------- desktop rail ---------- */}
      <div className={styles.rail}>
        <p className={styles.readout}>
          <span className={styles.srOnly}>Hora de la historia: </span>
          <span className={styles.clock} ref={(el) => { clockEls.current[0] = el; }}>
            22:47
          </span>
          <span className={styles.alt}>
            <svg viewBox="0 0 12 8" aria-hidden="true">
              <path d="M0 8 L4.2 1.6 L6.4 4.4 L8 2.6 L12 8 Z" fill="currentColor" />
            </svg>
            <span ref={altEl}>0 m</span>
          </span>
        </p>

        <div className={styles.ticksWrap}>
          <span className={styles.track} aria-hidden="true">
            <span ref={markerEl} className={styles.mover}>
              <span className={styles.marker} />
            </span>
          </span>
          <ol className={styles.ticks}>
          {CHAPTERS.map((c, i) => (
            <li key={c.id} data-active={i === active ? "1" : undefined} data-past={i < active ? "1" : undefined}>
              <a
                href={`#${c.target ?? c.id}`}
                onClick={(e) => go(e, c.target ?? c.id)}
                aria-current={i === active ? "step" : undefined}
              >
                <span className={styles.name}>{c.label}</span>
                <span className={styles.time}>{clock(c.min)}</span>
                <span className={styles.dot} aria-hidden="true" />
              </a>
            </li>
          ))}
          </ol>
        </div>

        <div className={styles.lamp}>
          <span className={styles.batt} aria-hidden="true">
            <span className={styles.battBody}>
              <span className={styles.battFill} ref={(el) => { battFill.current[0] = el; }} />
            </span>
          </span>
          <span className={styles.battPct} ref={(el) => { battEls.current[0] = el; }}>
            100 %
          </span>
          <button
            type="button"
            className={styles.lm}
            onClick={cycle}
            aria-label={`Potencia del frontal: ${lumens} lúmenes, modo ${modeName}. Cambiar potencia.`}
          >
            {lumens} lm
          </button>
        </div>
      </div>

      {/* ---------- mobile pill ---------- */}
      <div className={styles.pill}>
        <button
          type="button"
          className={styles.pillClock}
          aria-expanded={open}
          aria-controls="frontal-sheet"
          onClick={() => setOpen((v) => !v)}
        >
          <span className={styles.srOnly}>Capítulos. Hora de la historia: </span>
          <span ref={(el) => { clockEls.current[1] = el; }}>22:47</span>
          <svg viewBox="0 0 10 6" aria-hidden="true" data-open={open ? "1" : "0"}>
            <path d="M1 1 L5 5 L9 1" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
        <span className={styles.pillBatt} aria-hidden="true">
          <span className={styles.battBody}>
            <span className={styles.battFill} ref={(el) => { battFill.current[1] = el; }} />
          </span>
          <span ref={(el) => { battEls.current[1] = el; }}>100 %</span>
        </span>
        <button
          type="button"
          className={styles.pillLm}
          onClick={cycle}
          aria-label={`Potencia del frontal: ${lumens} lúmenes. Cambiar potencia.`}
        >
          {lumens} lm
        </button>
      </div>

      <div id="frontal-sheet" className={styles.sheet} data-open={open ? "1" : "0"} hidden={!open}>
        <ol>
          {CHAPTERS.map((c, i) => (
            <li key={c.id} data-active={i === active ? "1" : undefined}>
              <a
                href={`#${c.target ?? c.id}`}
                onClick={(e) => go(e, c.target ?? c.id)}
                aria-current={i === active ? "step" : undefined}
              >
                <span className={styles.sheetTime}>{clock(c.min)}</span>
                <span className={styles.sheetName}>{c.label}</span>
              </a>
            </li>
          ))}
        </ol>
        <Link href="/" className={styles.sheetBack}>
          ← Todas las versiones
        </Link>
      </div>
    </nav>
  );
}
