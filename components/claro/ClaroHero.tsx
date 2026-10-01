"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { scrollToId } from "@/lib/scroll";
import styles from "./claro.module.css";
import { IconArrow, IconCommunity, IconCompass, IconMountain } from "./icons";

const PLATE = "/heroes/claro/plate.jpg";
// The stage is wider than the viewport (cover); ask for an image that matches its width.
// Phones use a stage 118% of the viewport height (see .stage in the stylesheet).
const PLATE_SIZES = "(min-aspect-ratio: 2466/1000) 100vw, (max-width: 767px) 291vh, 247vh";

/**
 * Drifting fog sheets. `top`/`height` are % of the stage; `speed` is tiles per second
 * of idle drift; `scroll` is tiles travelled over the whole hero scroll; `rise` is the
 * upward lift (% of the strip height) while scrolling. Back layers sit behind the ridge
 * mask, the front one passes in front of the runner's ridge.
 */
const FOG = [
  { src: "/heroes/claro/fog-far.webp", aspect: 2400 / 560, top: 9, height: 42, speed: 0.0055, scroll: 0.22, rise: 10, opacity: 0.82 },
  { src: "/heroes/claro/fog-mid.webp", aspect: 2400 / 640, top: 23, height: 50, speed: 0.009, scroll: 0.42, rise: 16, opacity: 0.88 },
  { src: "/heroes/claro/fog-near.webp", aspect: 2400 / 720, top: 50, height: 62, speed: 0.016, scroll: 0.8, rise: 26, opacity: 0.5 },
] as const;

const FEATURES = [
  { icon: IconMountain, title: "Montaña", text: "Rutas guiadas" },
  { icon: IconCommunity, title: "Comunidad", text: "Personas afines" },
  { icon: IconCompass, title: "Experiencias", text: "Todo el año" },
];

function FogLayer({
  i,
  stripRef,
}: {
  i: number;
  stripRef: (el: HTMLDivElement | null) => void;
}) {
  const f = FOG[i];
  return (
    <div className={styles.fog} style={{ top: `${f.top}%`, height: `${f.height}%`, opacity: f.opacity }}>
      <div
        ref={stripRef}
        className={styles.fogStrip}
        style={{
          backgroundImage: `url(${f.src})`,
          backgroundSize: `${f.height * f.aspect}cqh 100%`,
          // one extra tile so the wrap-around is never visible
          width: `calc(100cqw + ${f.height * f.aspect * 2}cqh)`,
        }}
      />
    </div>
  );
}

export function ClaroHero() {
  const trackRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const whiteRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const calloutRef = useRef<HTMLDivElement>(null);
  const strips = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const stage = stageRef.current;
      if (!stage) return;

      // --- scroll choreography -------------------------------------------------
      let progress = 0;
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: trackRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: reduced ? true : 0.8,
          onUpdate: (self) => {
            progress = self.progress;
          },
        },
      });
      tl.to(stage, { scale: reduced ? 1 : 1.13, duration: 1 }, 0)
        .to(copyRef.current, { y: -70, autoAlpha: 0, ease: "power1.in", duration: 0.38 }, 0.02)
        .to(scrimRef.current, { autoAlpha: 0.3, duration: 0.4 }, 0.04)
        .to(hintRef.current, { autoAlpha: 0, duration: 0.08 }, 0)
        .fromTo(calloutRef.current, { autoAlpha: 0, x: -8 }, { autoAlpha: 1, x: 0, duration: 0.12 }, 0.34)
        .to(calloutRef.current, { autoAlpha: 0, duration: 0.1 }, 0.64)
        .fromTo(whiteRef.current, { opacity: 0 }, { opacity: 1, ease: "power2.in", duration: 0.26 }, 0.74);

      if (reduced) return () => tl.scrollTrigger?.kill();

      // --- idle drift + scroll-linked flow of the fog ---------------------------
      let tiles: number[] = [];
      const measure = () => {
        tiles = FOG.map((f) => (stage.offsetHeight * f.height * f.aspect) / 100);
      };
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(stage);

      let visible = true;
      const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0 });
      if (stickyRef.current) io.observe(stickyRef.current);

      let t = 0;
      const tick = (_time: number, deltaMs: number) => {
        if (!visible || document.hidden) return;
        t += Math.min(deltaMs, 64) / 1000;
        FOG.forEach((f, i) => {
          const el = strips.current[i];
          const tile = tiles[i];
          if (!el || !tile) return;
          const travelled = (t * f.speed + progress * f.scroll) % 1;
          el.style.transform = `translate3d(${(-travelled * tile).toFixed(1)}px, ${(-progress * f.rise).toFixed(2)}%, 0)`;
        });
      };
      gsap.ticker.add(tick);

      return () => {
        gsap.ticker.remove(tick);
        ro.disconnect();
        io.disconnect();
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    },
    { scope: trackRef },
  );

  return (
    <section ref={trackRef} className={styles.heroTrack} aria-labelledby="claro-hero-title">
      <div ref={stickyRef} className={styles.heroSticky}>
        <div ref={stageRef} className={styles.stage}>
          <div className={styles.layer}>
            <Image
              src={PLATE}
              alt="Un corredor del club, con la camiseta naranja y blanca, sube por una cresta verde rodeada por un mar de nubes."
              fill
              preload
              quality={85}
              sizes={PLATE_SIZES}
              className="object-cover"
            />
          </div>
          <FogLayer i={0} stripRef={(el) => void (strips.current[0] = el)} />
          <FogLayer i={1} stripRef={(el) => void (strips.current[1] = el)} />
          {/* the near ridge (and the runner) re-drawn on top: clouds now pass behind it */}
          <div className={`${styles.layer} ${styles.ridge}`} aria-hidden>
            <Image src={PLATE} alt="" fill quality={85} sizes={PLATE_SIZES} className="object-cover" />
          </div>
          <FogLayer i={2} stripRef={(el) => void (strips.current[2] = el)} />

          <div className={styles.callout} aria-hidden>
            <div ref={calloutRef} className={styles.calloutInner}>
              <span className={styles.calloutDot} />
              <span className={styles.calloutLine} />
              <span className={styles.calloutTag}>
                <span className={styles.calloutKicker}>Vertiniano</span>
                <span className={styles.calloutSub}>mirando cómo pasan las nubes</span>
              </span>
            </div>
          </div>
        </div>

        <div ref={scrimRef} className={styles.heroScrim} aria-hidden />
        <div ref={whiteRef} className={styles.whiteout} aria-hidden />

        <div className={styles.heroCopy}>
          <div ref={copyRef}>
            <p className={`${styles.eyebrow} text-[var(--c-ink)]`}>Un club para explorar</p>
            <h1 id="claro-hero-title" className={`${styles.display} ${styles.heroTitle}`}>
              Otra forma
              <br />
              de vivir
              <br />
              la naturaleza.
            </h1>
            <p className={styles.heroLead}>
              Rutas, aventura y comunidad para descubrir la montaña desde otra perspectiva.
            </p>
            <div className="mt-8 md:mt-10">
              <button type="button" onClick={() => scrollToId("unete", -20)} className={styles.pill}>
                Únete al club
                <IconArrow className="h-5 w-5" />
              </button>
            </div>
            <ul className={styles.featureRow}>
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex items-center gap-3">
                  <Icon className="h-8 w-9 shrink-0" />
                  <span className="leading-tight">
                    <span className="block text-[0.8rem] font-semibold uppercase tracking-[0.08em]">{title}</span>
                    <span className="block text-[0.85rem] text-[var(--c-ink-soft)]">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div ref={hintRef} className={styles.scrollHint} aria-hidden>
          <span className={styles.scrollHintBar} />
          <span className={styles.hintLabel}>Baja y mira las nubes</span>
        </div>
      </div>
    </section>
  );
}

