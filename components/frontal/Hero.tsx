"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Logo } from "@/components/shared/Logo";
import { scrollToId } from "@/lib/scroll";
import { BEAM_REST, IMG, STORY_NOTE, TRAIL_BOX, TWINKLES } from "./data";
import { LumenPicker } from "./LumenPicker";
import { TrailSnake } from "./snake";
import { trackScroll } from "./track";
import styles from "./hero.module.css";

// The stage keeps the panorama's aspect ratio and covers the viewport, so the
// rendered image is 100vw wide on very wide screens and ~236vh wide otherwise.
const SIZES = "(min-aspect-ratio: 33/14) 100vw, 236vh";
const pct = (v: number, of: number) => `${((v / of) * 100).toFixed(4)}%`;

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const posRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const meteorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const stage = stageRef.current;
    const pos = posRef.current;
    const inner = innerRef.current;
    const canvas = canvasRef.current;
    const meteor = meteorRef.current;
    if (!hero || !stage || !pos || !inner || !canvas || !meteor) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const snake = new TrailSnake(canvas);
    const t0 = performance.now();

    let sw = 1;
    let sh = 1;
    let restX = 0;
    let restY = 0;
    let bx = Number.NaN;
    let by = Number.NaN;
    let tx = 0;
    let ty = 0;
    let px = -1;
    let py = -1;
    let steering = false;
    let touching = false;
    let holdUntil = 0;
    let visible = true;
    let raf = 0;

    // The beam's origin sits on the rest point in CSS (so the first paint is right
    // even before hydration); JS moves it by the offset from there and keeps the
    // lit layer counter-translated so it stays glued to the panorama.
    const place = () => {
      pos.style.transform = `translate3d(${(bx - restX).toFixed(1)}px, ${(by - restY).toFixed(1)}px, 0)`;
      inner.style.transform = `translate3d(${(-bx).toFixed(1)}px, ${(-by).toFixed(1)}px, 0)`;
    };

    const measure = () => {
      const r = stage.getBoundingClientRect();
      sw = r.width;
      sh = r.height;
      restX = (BEAM_REST.x / IMG.w) * sw;
      restY = (BEAM_REST.y / IMG.h) * sh;
      snake.resize((TRAIL_BOX.w / IMG.w) * sw, (TRAIL_BOX.h / IMG.h) * sh, dpr);
      if (Number.isNaN(bx) || reduced) {
        bx = tx = restX;
        by = ty = restY;
      }
      place();
      snake.draw(reduced ? 24 : (performance.now() - t0) / 1000);
    };

    const frame = (now: number) => {
      raf = 0;
      if (!visible) return;
      const t = (now - t0) / 1000;

      if ((steering || now < holdUntil) && px >= 0) {
        // following the pointer, or gliding to where the finger tapped and holding there
        const r = stage.getBoundingClientRect();
        tx = px - r.left;
        ty = py - r.top;
      } else if (fine) {
        // resting on the trail, breathing slightly like a head that never stays still
        tx = restX + Math.sin(t * 0.7) * sw * 0.006;
        ty = restY + Math.sin(t * 1.1) * sh * 0.009;
      } else {
        // no mouse: the beam scans the mountain by itself
        const s = Math.max(0, t - 3.5);
        const vw = hero.clientWidth;
        tx = restX + Math.sin(s * 0.24) * vw * 0.36;
        ty = restY + Math.sin(s * 0.37) * sh * 0.11;
      }

      const k = steering ? 0.17 : now < holdUntil ? 0.12 : 0.035;
      bx += (tx - bx) * k;
      by += (ty - by) * k;
      place();
      snake.draw(t);
      raf = requestAnimationFrame(frame);
    };

    const kick = () => {
      if (!raf && visible && !reduced) raf = requestAnimationFrame(frame);
    };

    // ---------------- input ----------------
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch" && !touching) return;
      px = e.clientX;
      py = e.clientY;
      if (e.pointerType !== "touch") steering = true;
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      touching = true;
      steering = true;
      px = e.clientX;
      py = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      touching = false;
      steering = false;
      holdUntil = performance.now() + 3200;
    };
    const onOut = (e: MouseEvent) => {
      if (!e.relatedTarget) steering = false;
    };

    // ---------------- shooting stars ----------------
    let meteorTimer = 0;
    const fireMeteor = () => {
      if (visible && document.visibilityState === "visible") {
        const w = hero.clientWidth;
        const h = hero.clientHeight;
        const ltr = Math.random() < 0.5;
        meteor.style.setProperty("--mx", `${Math.round((0.14 + Math.random() * 0.6) * w)}px`);
        meteor.style.setProperty("--my", `${Math.round((0.05 + Math.random() * 0.2) * h)}px`);
        meteor.style.setProperty("--ma", `${ltr ? 16 + Math.random() * 20 : 164 - Math.random() * 20}deg`);
        meteor.dataset.go = "0";
        void meteor.offsetWidth;
        meteor.dataset.go = "1";
      }
      meteorTimer = window.setTimeout(fireMeteor, 7000 + Math.random() * 9000);
    };


    // ---------------- lifecycle ----------------
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        hero.dataset.paused = visible ? "0" : "1";
        kick();
      },
      { threshold: 0 },
    );
    io.observe(hero);

    // leaving the start line: the copy lifts and fades
    let stopScroll = () => {};
    if (!reduced) {
      stopScroll = trackScroll(hero, ({ height, scrollY }) => {
        hero.style.setProperty("--hp", Math.min(1, Math.max(0, scrollY / Math.max(1, height))).toFixed(3));
      });
      window.addEventListener("pointermove", onMove, { passive: true });
      hero.addEventListener("pointerdown", onDown, { passive: true });
      window.addEventListener("pointerup", onUp, { passive: true });
      window.addEventListener("pointercancel", onUp, { passive: true });
      document.addEventListener("mouseout", onOut);
      meteorTimer = window.setTimeout(fireMeteor, 4200);
      kick();
    }

    return () => {
      cancelAnimationFrame(raf);
      stopScroll();
      window.clearTimeout(meteorTimer);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.removeEventListener("mouseout", onOut);
    };
  }, []);

  return (
    <section id="salida" ref={heroRef} className={styles.hero} aria-labelledby="frontal-title">
      <div ref={stageRef} className={styles.stage}>
        <Image
          src="/frontal/night-dark-v2.jpg"
          alt="Noche cerrada en la sierra: la costa encendida junto al mar, la Vía Láctea y una gran montaña de cima plana con un sendero en zigzag."
          fill
          loading="eager"
          fetchPriority="high"
          quality={85}
          sizes={SIZES}
          className={styles.plate}
        />
        <div
          ref={posRef}
          className={styles.beamPos}
          aria-hidden="true"
          style={{ left: pct(BEAM_REST.x, IMG.w), top: pct(BEAM_REST.y, IMG.h) }}
        >
          <div className={styles.halo} />
          <div className={styles.beam}>
            <div
              ref={innerRef}
              className={styles.beamInner}
              style={{
                transform: `translate(-${pct(BEAM_REST.x, IMG.w)}, -${pct(BEAM_REST.y, IMG.h)})`,
              }}
            >
              <Image
                src="/frontal/night-lit-v2.jpg"
                alt=""
                fill
                loading="eager"
                quality={85}
                sizes={SIZES}
                className={styles.plate}
              />
            </div>
          </div>
        </div>
        <canvas
          ref={canvasRef}
          className={styles.snake}
          aria-hidden="true"
          style={{
            left: pct(TRAIL_BOX.x, IMG.w),
            top: pct(TRAIL_BOX.y, IMG.h),
            width: pct(TRAIL_BOX.w, IMG.w),
            height: pct(TRAIL_BOX.h, IMG.h),
          }}
        />
        <div className={styles.twinkles} aria-hidden="true">
          {TWINKLES.map(([x, y, s], i) => (
            <span
              key={i}
              style={
                {
                  left: pct(x, IMG.w),
                  top: pct(y, IMG.h),
                  "--s": s,
                  "--d": `${(3.2 + ((i * 37) % 47) / 10).toFixed(1)}s`,
                  "--delay": `${(-((i * 53) % 71) / 10).toFixed(1)}s`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      </div>

      <div className={styles.shade} aria-hidden="true" />
      <div ref={meteorRef} className={styles.meteor} aria-hidden="true" />

      <div className={styles.top}>
        <Logo tone="light" href={null} className={styles.logo} />
        <Link href="/" className={styles.back}>
          ← Todas las versiones
        </Link>
      </div>

      <div className={styles.copy}>
        <h1 id="frontal-title" className={styles.title}>
          <span>Enciende</span> <span>el frontal.</span>
        </h1>
        <div className={styles.copyBottom}>
          <p className={styles.lead}>
            Somos C.D. La Otra Vertiente, club de montaña de Rincón de la Victoria. Este verano encendimos el
            frontal en Carratraca, en La Jábega y en San Antón.{" "}
            <span className={styles.hint}>
              <span className={styles.onHover}>Mueve la luz</span>
              <span className={styles.onTouch}>Toca para apuntar la luz</span> y sigue la fila que sube en
              zigzag.
            </span>
          </p>
          <LumenPicker name="lm-hero" className={styles.picker} />
          <p className={styles.storyNote}>{STORY_NOTE}</p>
        </div>
      </div>

      <p className={styles.watch} aria-hidden="true">
        <span className={styles.watchTime}>
          22<span className={styles.colon}>:</span>47
        </span>
        <span>36,72° N 4,28° O</span>
      </p>

      <a
        href="#noche"
        className={styles.cue}
        onClick={(e) => {
          e.preventDefault();
          scrollToId("noche", 0);
        }}
      >
        Salimos
      </a>
    </section>
  );
}
