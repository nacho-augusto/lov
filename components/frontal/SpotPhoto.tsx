"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { ClubPhoto } from "@/content";
import styles from "./spot.module.css";

/**
 * A club photo kept in the dark until the headlamp passes over it.
 * - Mouse/pen: a spot follows the pointer (size = current headlamp power).
 * - Touch / no hover: the photo lights itself when it scrolls into view.
 * - Keyboard: focusing anything in the same row lights it fully (CSS :focus-within).
 */
export function SpotPhoto({
  photo,
  sizes,
  className,
  caption,
}: {
  photo: ClubPhoto;
  sizes: string;
  className?: string;
  caption?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    let r = 0;
    let target = 0;
    let mx = 0.5;
    let my = 0.5;
    let tmx = 0.5;
    let tmy = 0.5;
    let raf = 0;
    let w = 1;
    let h = 1;

    const spotR = () => parseFloat(getComputedStyle(el).getPropertyValue("--spot-r")) || 150;
    const write = () => {
      el.style.setProperty("--r", `${r.toFixed(1)}px`);
      el.style.setProperty("--mx", `${(mx * w).toFixed(1)}px`);
      el.style.setProperty("--my", `${(my * h).toFixed(1)}px`);
    };
    const tick = () => {
      r += (target - r) * 0.14;
      mx += (tmx - mx) * 0.22;
      my += (tmy - my) * 0.22;
      write();
      const moving = Math.abs(target - r) > 0.4 || Math.abs(tmx - mx) + Math.abs(tmy - my) > 0.001;
      raf = moving ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => {
      if (reduced) {
        r = target;
        mx = tmx;
        my = tmy;
        write();
        return;
      }
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const measure = () => {
      const b = el.getBoundingClientRect();
      w = b.width;
      h = b.height;
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    if (fine) {
      // While you pass by, your headlamp rests on the photo (a soft spot near the
      // centre); point at it and the spot follows you at full power.
      let hovered = false;
      let inView = false;
      const rest = () => {
        if (hovered) return;
        tmx = 0.5;
        tmy = 0.44;
        target = inView ? spotR() * 0.62 : 0;
        kick();
      };
      const onEnter = (e: PointerEvent) => {
        hovered = true;
        measure();
        const b = el.getBoundingClientRect();
        tmx = (e.clientX - b.left) / w;
        tmy = (e.clientY - b.top) / h;
        target = spotR();
        kick();
      };
      const onMove = (e: PointerEvent) => {
        const b = el.getBoundingClientRect();
        tmx = (e.clientX - b.left) / w;
        tmy = (e.clientY - b.top) / h;
        target = spotR();
        kick();
      };
      const onLeave = () => {
        hovered = false;
        rest();
      };
      const io = new IntersectionObserver(
        ([entry]) => {
          inView = entry.isIntersecting;
          measure();
          rest();
        },
        { rootMargin: "-22% 0px -22% 0px" },
      );
      io.observe(el);
      el.addEventListener("pointerenter", onEnter);
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
      return () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        io.disconnect();
        el.removeEventListener("pointerenter", onEnter);
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
      };
    }

    // touch: sweep the beam across once when the photo arrives, then leave it lit
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        measure();
        mx = 0.08;
        my = 0.62;
        tmx = 0.5;
        tmy = 0.45;
        target = Math.hypot(w, h) * 0.62;
        kick();
      },
      { threshold: 0.55 },
    );
    io.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <figure className={`${styles.spot} ${className ?? ""}`}>
      <div ref={ref} className={styles.frame} style={{ aspectRatio: `${photo.width} / ${photo.height}` }}>
        <Image
          src={photo.src}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          sizes={sizes}
          quality={75}
          className={styles.img}
        />
        <span className={styles.dark} aria-hidden="true" />
        <span className={styles.warm} aria-hidden="true" />
      </div>
      <figcaption className={styles.caption}>{caption ?? photo.caption}</figcaption>
    </figure>
  );
}
