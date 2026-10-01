"use client";

import { useEffect, useRef } from "react";
import { photoById, seasonEvents } from "@/content";
import { LightTrail } from "./LightTrail";
import { SpotPhoto } from "./SpotPhoto";
import f from "./frontal.module.css";
import s from "./nocturnas.module.css";

const NIGHTS = seasonEvents.filter((e) => e.night);

/** Which photo leads each night (when the club published one). */
const LEAD_PHOTO: Record<string, string> = {
  "omd-utmb": "omd-finishers",
  "ronda-101": "ronda-101-meta",
  carratraca: "carratraca-meta",
  "san-anton-trail": "san-anton-noche",
};

const DRAWING: Record<string, { variant: "frigiliana" | "jabega"; label: string }> = {
  "nocturna-frigiliana": {
    variant: "frigiliana",
    label: "Dibujo de una ruta de luz que sube en zigzag desde Frigiliana al Pico del Cielo y sigue la cresta hasta Navachica.",
  },
  "trail-nocturno-la-jabega": {
    variant: "jabega",
    label: "Dibujo de una ruta de luz que sale de la playa, sube a la montaña y vuelve al mar, con las luces del pueblo en la orilla.",
  },
};

function checkpoint(i: number, n: number) {
  if (i === 0) return "Salida";
  if (i === n - 1) return "Meta";
  return `PC ${i}`;
}

/** Chapter 00:40 — the season's night races as the checkpoints of a single night. */
export function Nocturnas() {
  const listRef = useRef<HTMLOListElement>(null);

  // Checkpoints light up as you reach them.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const rows = Array.from(list.querySelectorAll<HTMLElement>("[data-spotrow]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) (e.target as HTMLElement).dataset.lit = "1";
      },
      { rootMargin: "0px 0px -45% 0px" },
    );
    rows.forEach((r) => io.observe(r));
    return () => io.disconnect();
  }, []);

  return (
    <section id="nocturnas" className={`${f.chapter} ${s.section}`} aria-labelledby="nocturnas-title">
      <div className={f.wrap}>
        <header className={f.chHead}>
          <span className={f.chClock} aria-hidden="true">
            00:40
          </span>
          <h2 id="nocturnas-title" className={f.chTitle}>
            Nocturnas 2026
          </h2>
          <p className={f.chLead}>
            Las noches de la temporada, en orden, como los puntos de control de una misma carrera.{" "}
            <span className={f.onHover}>Pasa la luz por cada foto para verla.</span>
            <span className={f.onTouch}>Cada foto se enciende cuando llegas a ella.</span>
          </p>
        </header>

        <ol ref={listRef} className={s.route}>
          {NIGHTS.map((e, i) => {
            const photoId = LEAD_PHOTO[e.id];
            const photo = photoId ? photoById(photoId) : null;
            const drawing = DRAWING[e.id];
            const portrait = photo ? photo.height > photo.width * 1.1 : false;
            const landscape = photo ? photo.width > photo.height * 1.1 : false;
            return (
              <li
                key={e.id}
                className={s.row}
                data-spotrow=""
                data-side={i % 2 ? "left" : "right"}
                data-shape={portrait ? "portrait" : landscape ? "landscape" : "square"}
              >
                <p className={s.pc}>
                  <span className={s.node} aria-hidden="true" />
                  <span className={s.pcLabel}>{checkpoint(i, NIGHTS.length)}</span>
                  <span className={s.date}>{e.dateLabel}</span>
                </p>

                <div className={s.text}>
                  <h3 className={s.title}>{e.title}</h3>
                  <p className={s.place}>{e.place}</p>
                  <p className={s.summary}>{e.summary}</p>
                  {e.stats && e.stats.length > 0 && (
                    <dl className={s.stats}>
                      {e.stats.map((st) => (
                        <div key={st.label}>
                          <dt>{st.label}</dt>
                          <dd>{st.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  <a className={s.source} href={e.source} target="_blank" rel="noopener noreferrer">
                    Ver la publicación del club
                    <span className={f.srOnly}> sobre {e.title} en Instagram (se abre en otra pestaña)</span>
                  </a>
                </div>

                <div className={s.media}>
                  {photo ? (
                    <SpotPhoto
                      photo={photo}
                      sizes={
                        landscape
                          ? "(max-width: 900px) 92vw, 520px"
                          : portrait
                            ? "(max-width: 900px) 80vw, 380px"
                            : "(max-width: 900px) 90vw, 450px"
                      }
                    />
                  ) : drawing ? (
                    <figure className={s.drawing}>
                      <LightTrail variant={drawing.variant} label={drawing.label} />
                      <figcaption>No hay foto de esta noche: así la dibujaría un frontal en larga exposición.</figcaption>
                    </figure>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
