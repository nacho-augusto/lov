"use client";

import Image from "next/image";
import { useRef } from "react";
import { club, photoById, season, seasonEvents, seasonKindLabel, seasonStats } from "@/content";
import type { SeasonEvent } from "@/content";
import { gsap, useGSAP } from "@/lib/gsap";
import { Reveal } from "./Reveal";
import styles from "./claro.module.css";
import { IconArrowUpRight, IconInstagram, IconMoon } from "./icons";

function CardMeta({ event }: { event: SeasonEvent }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={styles.chip}>{seasonKindLabel[event.kind]}</span>
      {event.night && (
        <span className={styles.chip}>
          <IconMoon className="h-3.5 w-3.5" />
          Con frontal
        </span>
      )}
    </div>
  );
}

function SeasonCard({ event, index }: { event: SeasonEvent; index: number }) {
  const photo = event.photos[0] ? photoById(event.photos[0]) : null;
  const stats = event.stats?.slice(0, 2) ?? [];
  const label = `${event.title}, ${event.dateLabel}: ver la publicación en Instagram`;

  if (!photo) {
    // No photo in the club's post: a typographic card led by its headline figure.
    const lead = event.stats?.[0];
    return (
      <a
        href={event.source}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className={`${styles.card} ${styles.cardType}`}
      >
        <div className="flex h-full flex-col p-6">
          <div className="flex items-start justify-between gap-4">
            <CardMeta event={event} />
            <IconArrowUpRight className="h-5 w-5 shrink-0" />
          </div>
          <div className="mt-auto">
            <p className={`${styles.display} text-[clamp(3.6rem,6vw,5.6rem)] text-[var(--c-orange)]`}>
              {lead ? lead.value : String(index + 1).padStart(2, "0")}
            </p>
            {lead && <p className="mt-1 text-sm text-[var(--c-ink-soft)]">{lead.label}</p>}
            <p className={`${styles.eyebrow} mt-6 text-[var(--c-stone)]`}>{event.dateLabel}</p>
            <h3 className={`${styles.display} mt-2 text-[2rem]`}>{event.title}</h3>
            <p className="mt-2 text-[0.95rem] text-[var(--c-ink-soft)]">{event.place}</p>
          </div>
        </div>
      </a>
    );
  }

  return (
    <a href={event.source} target="_blank" rel="noopener noreferrer" aria-label={label} className={styles.card}>
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes="(min-width: 768px) 30vw, 82vw"
        className="object-cover"
      />
      <div className={styles.cardShade} aria-hidden />
      <div className="absolute inset-x-0 top-0 z-[2] flex items-start justify-between gap-4 p-6">
        <CardMeta event={event} />
        <IconArrowUpRight className="h-5 w-5 shrink-0" />
      </div>
      <div className={styles.cardBody}>
        <p className={`${styles.eyebrow} text-white/75`}>{event.dateLabel}</p>
        <h3 className={`${styles.display} mt-2 text-[2rem]`}>{event.title}</h3>
        <p className="mt-2 text-[0.95rem] text-white/80">{event.place}</p>
        {stats.length > 0 && (
          <dl className="mt-4 flex gap-6 border-t border-white/25 pt-4">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd className={`${styles.display} text-[1.6rem]`}>{s.value}</dd>
                <dd className="text-xs text-white/70">{s.label}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </a>
  );
}

export function ClaroSeason() {
  const trackRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      // Desktop: the rail is pinned (CSS sticky) and slides sideways as the page scrolls.
      // Phones and reduced motion keep a native, swipeable row instead.
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const track = trackRef.current;
        const rail = railRef.current;
        if (!track || !rail) return;

        const distance = () => Math.max(0, rail.scrollWidth - window.innerWidth);
        const size = () => {
          track.style.height = `${window.innerHeight + distance()}px`;
        };
        size();

        const tween = gsap.to(rail, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: track,
            start: "top top",
            end: () => `+=${distance()}`,
            scrub: 0.6,
            invalidateOnRefresh: true,
            onRefreshInit: size,
            onUpdate: (self) => {
              if (barRef.current) barRef.current.style.transform = `scaleX(${self.progress})`;
            },
          },
        });

        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
          track.style.height = "";
          gsap.set(rail, { clearProps: "transform" });
        };
      });
      return () => mm.revert();
    },
    { scope: trackRef },
  );

  return (
    <section id="temporada" aria-labelledby="claro-season-title" className="relative">
      <div className={`${styles.container} pt-[clamp(5rem,14vh,9rem)]`}>
        <div className="grid gap-10 md:grid-cols-12 md:items-end">
          <Reveal className="md:col-span-7">
            <p className={`${styles.eyebrow} text-[var(--c-orange-deep)]`}>{season.title}</p>
            <h2 id="claro-season-title" className={`${styles.display} ${styles.h2} mt-4`}>
              Así ha sido
              <br />
              el año vertiniano
            </h2>
          </Reveal>
          <Reveal className="md:col-span-5" delay={120}>
            <p className={styles.lead}>{season.intro}</p>
          </Reveal>
        </div>

        <Reveal delay={160}>
          <dl className={styles.statRow}>
            {seasonStats.map((s) => (
              <div key={s.label} className={styles.stat}>
                <dt className="order-2 mt-2 text-[0.9rem] text-[var(--c-ink-soft)]">{s.label}</dt>
                <dd className={`${styles.display} order-1 text-[clamp(3rem,5.4vw,5rem)]`}>{s.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>

      <div ref={trackRef} className={styles.railTrack}>
        <div className={styles.railSticky}>
          <div ref={railRef} className={styles.rail} role="list" aria-label="Citas de la temporada">
            {seasonEvents.map((event, i) => (
              <div key={event.id} role="listitem" className={styles.railItem}>
                <SeasonCard event={event} index={i} />
              </div>
            ))}
            <div role="listitem" className={styles.railItem}>
              <a
                href={club.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.card} ${styles.cardNext}`}
              >
                <div className="flex h-full flex-col p-7">
                  <IconInstagram className="h-8 w-8" />
                  <div className="mt-auto">
                    <p className={`${styles.eyebrow} text-white/70`}>Lo siguiente</p>
                    <p className={`${styles.display} mt-3 text-[2.6rem]`}>{season.next}</p>
                    <p className="mt-5 inline-flex items-center gap-2 text-[0.95rem] font-medium">
                      Síguelo en {club.instagramHandle}
                      <IconArrowUpRight className="h-4 w-4" />
                    </p>
                  </div>
                </div>
              </a>
            </div>
          </div>
          <div className={styles.railProgress} aria-hidden>
            <div ref={barRef} className={styles.railProgressBar} />
          </div>
        </div>
      </div>
    </section>
  );
}
