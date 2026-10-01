"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { club, photoById, values } from "@/content";
import { trackScroll } from "./track";
import f from "./frontal.module.css";
import s from "./vertinianos.module.css";

const PHOTOS = [
  { id: "omd-finishers", cls: "a", sizes: "(max-width: 900px) 88vw, 520px" },
  { id: "el-fuerte-trio", cls: "b", sizes: "(max-width: 900px) 60vw, 300px" },
  { id: "pico-del-cielo-cruz", cls: "c", sizes: "(max-width: 900px) 56vw, 280px" },
] as const;

/** Chapter 05:20 — who we are. Blue hour: the photos warm up as dawn gets closer. */
export function Vertinianos() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--warm", "1");
      el.querySelectorAll<HTMLElement>("[data-lamp]").forEach((x) => (x.dataset.on = "1"));
      return;
    }
    const stop = trackScroll(el, ({ top, height, scrollY, vh }) => {
      const p = (vh - (top - scrollY)) / (height + vh * 0.2);
      el.style.setProperty("--warm", Math.min(1, Math.max(0, p * 1.15 - 0.12)).toFixed(3));
    });

    // the four lamps of the line switch on one after another
    const lamps = el.querySelector<HTMLElement>("[data-lamps]");
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || !lamps) return;
        lamps.querySelectorAll<HTMLElement>("[data-lamp]").forEach((x, i) => {
          window.setTimeout(() => (x.dataset.on = "1"), 260 * i);
        });
        io.disconnect();
      },
      { threshold: 0.2 },
    );
    if (lamps) io.observe(lamps);

    return () => {
      stop();
      io.disconnect();
    };
  }, []);

  return (
    <section
      id="vertinianos"
      ref={ref}
      className={`${f.chapter} ${s.section}`}
      aria-labelledby="vertinianos-title"
    >
      <div className={f.wrap}>
        <header className={f.chHead}>
          <span className={f.chClock} aria-hidden="true">
            05:20
          </span>
          <h2 id="vertinianos-title" className={f.chTitle}>
            Somos {club.memberTerm}.
          </h2>
          <p className={f.chLead}>
            De día, un club deportivo de {club.town}. De noche, una fila de frontales subiendo la sierra.
          </p>
        </header>

        <div className={s.grid}>
          <dl className={s.card}>
            <div>
              <dt>El club</dt>
              <dd>
                {club.name}. {club.igBio}.
              </dd>
            </div>
            <div>
              <dt>En casa</dt>
              <dd>
                {club.town}, {club.region.replace(" · ", ", ")}.
              </dd>
            </div>
            <div>
              <dt>Federados</dt>
              <dd>
                {club.federation}, con el nº {club.federationNumber}.
              </dd>
            </div>
            <div>
              <dt>Qué hacemos</dt>
              <dd>{club.rhythm}</dd>
            </div>
            <div>
              <dt>Cómo nos llamamos</dt>
              <dd>
                {club.memberTerm.charAt(0).toUpperCase() + club.memberTerm.slice(1)} y vertinianas. Al club, en
                corto, {club.nickname}.
              </dd>
            </div>
          </dl>

          <div className={s.photos}>
            {PHOTOS.map(({ id, cls, sizes }) => {
              const p = photoById(id);
              return (
                <figure key={id} className={`${s.photo} ${s[cls]}`}>
                  <div className={s.frame} style={{ aspectRatio: `${p.width} / ${p.height}` }}>
                    <Image src={p.src} alt={p.alt} width={p.width} height={p.height} sizes={sizes} quality={75} />
                  </div>
                  <figcaption>{p.caption}</figcaption>
                </figure>
              );
            })}
          </div>
        </div>

        <section className={s.rules} aria-labelledby="normas-title">
          <h3 id="normas-title" className={s.rulesTitle}>
            Las normas de la fila
          </h3>
          <ul className={s.lamps} data-lamps="">
            {values.map((v) => (
              <li key={v.id} data-lamp="" className={s.lamp}>
                <span className={s.bulb} aria-hidden="true" />
                <p className={s.lampTitle}>{v.title}</p>
                <p className={s.lampDesc}>{v.desc}</p>
              </li>
            ))}
          </ul>
        </section>

        <p className={s.tagline}>{club.tagline}</p>
      </div>
    </section>
  );
}
