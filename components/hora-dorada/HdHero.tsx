"use client";

import { getImageProps } from "next/image";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { Dust } from "./Dust";
import styles from "./hd.module.css";

const DIR = "/heroes/hora-dorada";
// Usable footage: the lettering on the shirts holds until ~3.2 s of the generated clip.
const DURATION = 3.2;
const FPS = 24;
// Share of the scroll spent scrubbing the clip; the rest closes the letterbox to black.
const SCRUB_END = 0.86;

const SUBTITLES = [
  { text: "— ¿Hasta dónde subimos hoy?", from: 0.3, to: 0.48 },
  { text: "— Hasta donde nos lleve la luz.", from: 0.56, to: 0.76 },
];

// sun-flare ghosts along the line from the sun through the frame centre
const GHOSTS = [
  { x: 31, y: 34, d: 5 },
  { x: 44, y: 45, d: 2.2 },
  { x: 61, y: 59, d: 9 },
  { x: 77, y: 72, d: 3.2 },
];

function timecode(seconds: number) {
  const frames = Math.round(seconds * FPS);
  const ff = String(frames % FPS).padStart(2, "0");
  const ss = String(Math.floor(frames / FPS)).padStart(2, "0");
  return `00:00:${ss}:${ff}`;
}

// Bar height as a fraction of the viewport for a 2.39:1 frame (fixed bars on portrait screens).
function letterbox() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (vw < 768 || vw / vh < 1.25) return 0.085;
  return gsap.utils.clamp(0.06, 0.2, (1 - vw / 2.39 / vh) / 2);
}

function posterSources() {
  const common = { alt: "", sizes: "100vw", quality: 85, loading: "eager" as const };
  const desktop = getImageProps({ ...common, src: `${DIR}/poster.jpg`, width: 1920, height: 1080 }).props;
  const still = getImageProps({ ...common, src: `${DIR}/still.jpg`, width: 1672, height: 941 }).props;
  const portrait = getImageProps({ ...common, src: `${DIR}/poster-portrait.jpg`, width: 608, height: 1080 }).props;
  return { desktop, still, portrait };
}

export function HdHero() {
  const trackRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);
  const slateRef = useRef<HTMLDivElement>(null);
  const tcRef = useRef<HTMLSpanElement>(null);
  const ghostsRef = useRef<HTMLDivElement>(null);
  const subsRef = useRef<(HTMLParagraphElement | null)[]>([]);
  const { desktop, still, portrait } = posterSources();

  useGSAP(
    () => {
      const bars = [topRef.current, bottomRef.current];
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        gsap.set(bars, { scaleY: letterbox() / 0.5 });
        return;
      }

      const video = videoRef.current;
      let target = 0;

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: trackRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            target = Math.min(1, self.progress / SCRUB_END) * DURATION;
            if (tcRef.current) tcRef.current.textContent = timecode(target);
          },
        },
      });
      tl.fromTo(bars, { scaleY: () => letterbox() / 0.5 }, { scaleY: 0.07, duration: 0.2 }, 0.1)
        .to(titleRef.current, { autoAlpha: 0, y: -40, duration: 0.18 }, 0.04)
        .to(dimRef.current, { autoAlpha: 0, duration: 0.22 }, 0.04)
        .to(ghostsRef.current, { x: "-4%", y: "-3%", duration: SCRUB_END }, 0)
        .to(slateRef.current, { autoAlpha: 0, duration: 0.06 }, SCRUB_END - 0.08)
        .to(bars, { scaleY: 1, duration: 1 - SCRUB_END, ease: "power2.in" }, SCRUB_END);
      SUBTITLES.forEach((s, i) => {
        const el = subsRef.current[i];
        tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03 }, s.from).to(
          el,
          { autoAlpha: 0, duration: 0.03 },
          s.to,
        );
      });

      if (!video) return;
      // Prime the decoder: some browsers (iOS) only paint seeked frames after a play().
      video.play().then(() => video.pause(), () => undefined);

      // Ease the playhead towards the scroll position and only seek when the last seek
      // has landed: short-GOP footage keeps each seek cheap.
      let current = 0;
      const tick = () => {
        if (video.readyState < 2) return;
        current += (target - current) * 0.2;
        if (!video.seeking && Math.abs(video.currentTime - current) > 1 / (FPS * 2)) {
          video.currentTime = current;
        }
      };
      gsap.ticker.add(tick);
      return () => gsap.ticker.remove(tick);
    },
    { scope: trackRef },
  );

  return (
    <section
      ref={trackRef}
      id="apertura"
      data-hd-chapter="Apertura"
      className={styles.heroTrack}
      aria-labelledby="hd-title"
    >
      <div className={styles.heroSticky}>
        <div className={styles.stage}>
          <picture>
            <source media="(prefers-reduced-motion: reduce) and (min-width: 768px)" srcSet={still.srcSet} />
            <source media="(max-width: 767px)" srcSet={portrait.srcSet} />
            <source srcSet={desktop.srcSet} />
            <img
              {...desktop}
              alt="Cuatro corredores del club, con la camiseta naranja y blanca, suben por un sendero de caliza al atardecer con el mar al fondo."
              className={styles.media}
              fetchPriority="high"
            />
          </picture>
          <video
            ref={videoRef}
            className={`${styles.media} ${styles.video}`}
            muted
            playsInline
            preload="auto"
            aria-hidden
            tabIndex={-1}
          >
            <source src={`${DIR}/runners-portrait.mp4`} type="video/mp4" media="(max-width: 767px)" />
            <source src={`${DIR}/runners.mp4`} type="video/mp4" />
          </video>
          <div className={styles.flare} aria-hidden>
            <div className={styles.flareCore} />
            <div className={styles.flareStreak} />
            <div ref={ghostsRef} className="absolute inset-0">
              {GHOSTS.map((g) => (
                <span
                  key={g.x}
                  className={styles.ghost}
                  style={{ left: `${g.x}%`, top: `${g.y}%`, width: `${g.d}cqw`, height: `${g.d}cqw` }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className={styles.grade} aria-hidden />
        <Dust className={styles.dust} />
        <div ref={dimRef} className={styles.dim} aria-hidden />

        <div ref={titleRef} className={styles.titleCard}>
          <p className={`${styles.mono} ${styles.gold}`}>C.D. La Otra Vertiente presenta</p>
          <h1 id="hd-title" className={`${styles.serif} ${styles.heroTitle} mt-5`}>
            La otra <em>vertiente</em>
          </h1>
          <p className={styles.heroLead}>
            Un club de trail running entre el mar y la sierra. Rincón de la Victoria, Málaga.
          </p>
        </div>

        {SUBTITLES.map((s, i) => (
          <p key={s.text} ref={(el) => void (subsRef.current[i] = el)} className={styles.subtitle} aria-hidden>
            {s.text}
          </p>
        ))}

        <div className={`${styles.bar} ${styles.barTop}`} ref={topRef} aria-hidden />
        <div className={`${styles.bar} ${styles.barBottom}`} ref={bottomRef} aria-hidden />

        <div ref={slateRef} className={`${styles.slateLine} ${styles.slateBottom} ${styles.mono}`} aria-hidden>
          <span className={styles.rollCue}>Desliza para rodar</span>
          <span className="hidden sm:inline">Esc. 01 · Ext. sierra · Hora dorada</span>
          <span className={styles.tc} ref={tcRef}>
            00:00:00:00
          </span>
        </div>
      </div>
    </section>
  );
}
