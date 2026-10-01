"use client";

import { useEffect, useRef } from "react";
import { seasonEvents, seasonStats } from "@/content";
import { trackScroll } from "./track";
import f from "./frontal.module.css";
import s from "./noche.module.css";

const MANIFESTO =
  "De día, la sierra se ve entera y se corre con prisa. De noche se encoge hasta caber en un círculo de luz: tus pies, la piedra siguiente y la respiración del que va delante. Abajo se enciende la costa; arriba solo quedan las estrellas y una fila de frontales subiendo en zigzag. Por eso salimos cuando otros vuelven.";

const frigiliana = seasonEvents.find((e) => e.id === "nocturna-frigiliana");
const sanAnton = seasonEvents.find((e) => e.id === "san-anton-trail");
const withHeadlamp = seasonStats.find((x) => /frontal/i.test(x.label));

/** Chapter 23:15 — why the night. The manifesto is read with the headlamp: it lights up as you scroll. */
export function Noche() {
  const pRef = useRef<HTMLParagraphElement>(null);
  const words = MANIFESTO.split(" ");

  useEffect(() => {
    const p = pRef.current;
    if (!p) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      p.style.setProperty("--p", "1");
      return;
    }
    // 0 when the paragraph enters the lower part of the screen, 1 when it reaches the upper third
    return trackScroll(p, ({ top, height, scrollY, vh }) => {
      const prog = (vh * 0.86 - (top - scrollY)) / (height + vh * 0.42);
      p.style.setProperty("--p", Math.min(1.08, Math.max(0, prog)).toFixed(4));
    });
  }, []);

  return (
    <section id="noche" className={`${f.chapter} ${s.noche}`} aria-labelledby="noche-title">
      <div className={f.wrap}>
        <header className={f.chHead}>
          <span className={f.chClock} aria-hidden="true">
            23:15
          </span>
          <h2 id="noche-title" className={f.chTitle}>
            De noche, la montaña tiene otra vertiente.
          </h2>
        </header>

        <div className={s.grid}>
          <p
            ref={pRef}
            className={s.manifesto}
            style={{ "--n": words.length } as React.CSSProperties}
          >
            {words.map((w, i) => (
              <span key={i} style={{ "--i": i } as React.CSSProperties}>
                {w}{" "}
              </span>
            ))}
          </p>

          <dl className={s.log}>
            <div className={s.entry}>
              <dt>{frigiliana?.dateLabel.replace(" 2026", "") ?? "Abril"}</dt>
              <dd>
                Una noche entera de montaña desde Frigiliana: Navachica y el Pico del Cielo, con invitados de
                Triaworld Mountain.
              </dd>
            </div>
            <div className={s.entry}>
              <dt>{withHeadlamp?.value ?? "5"}</dt>
              <dd>Carreras con frontal en la temporada 2026.</dd>
            </div>
            <div className={s.entry}>
              <dt>28 ago</dt>
              <dd>
                {sanAnton?.title ?? "San Antón Trail Festival"}: el broche final a las carreras nocturnas del
                verano.
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
