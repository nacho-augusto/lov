"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { photoById, season, seasonEvents, seasonKindLabel, seasonStats, type SeasonEvent } from "@/content";
import { ACHIEVEMENTS, RARITY_LABEL } from "./copy";
import { PixelIcon } from "./PixelIcon";
import { emit } from "./store";

function Thumb({ id, size = 96 }: { id: string; size?: number }) {
  const p = photoById(id);
  return (
    <Image
      className="lq-thumb"
      src={`/lov-quest/caps/${id}-8bit.png`}
      width={size}
      height={size}
      alt={p.alt}
      unoptimized
    />
  );
}

function Stats({ e }: { e: SeasonEvent }) {
  if (!e.stats?.length) return null;
  return (
    <dl className="lq-ach__stats">
      {e.stats.map((s) => (
        <div key={s.label}>
          <dt>{s.label}</dt>
          <dd>{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Achievements() {
  const ref = useRef<HTMLDivElement>(null);
  const legend = seasonEvents.find((e) => e.id === "omd-utmb")!;
  const rest = seasonEvents.filter((e) => e.id !== "omd-utmb");
  const total = seasonEvents.length;

  // one orchestrated moment: the "achievement unlocked" toast when the screen arrives
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          emit("toast", { title: "Logro desbloqueado", text: ACHIEVEMENTS["omd-utmb"].name, tone: "gold" });
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="lq-ach" ref={ref}>
      <div className="lq-frame lq-ach__progress">
        <p className="lq-ach__count">
          <span className="lq-num">
            {total}/{total}
          </span>
          <span>Logros de la temporada {season.year}</span>
        </p>
        <div className="lq-meter" role="img" aria-label="Progreso: 100 %">
          {Array.from({ length: 20 }, (_, i) => (
            <i key={i} />
          ))}
          <span>100%</span>
        </div>
        <dl className="lq-ach__season">
          {seasonStats.map((s) => (
            <div key={s.label}>
              <dt>{s.label}</dt>
              <dd className="lq-num">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* legendary */}
      <article className="lq-frame lq-frame--gold lq-ach__legend" aria-labelledby="ach-omd">
        <div className="lq-ach__legend-head">
          <PixelIcon name={ACHIEVEMENTS[legend.id].icon} size={96} className="lq-ach__icon" />
          <div>
            <p className="lq-ach__meta">
              <span className="lq-rarity lq-rarity--legendario">{RARITY_LABEL.legendario}</span>
              <span>{legend.dateLabel}</span>
              <span>{seasonKindLabel[legend.kind]}</span>
            </p>
            <h3 id="ach-omd" className="lq-ach__name">
              {ACHIEVEMENTS[legend.id].name}
            </h3>
            <p className="lq-ach__event">
              {legend.title} · {legend.place}
            </p>
          </div>
        </div>
        <div className="lq-ach__legend-body">
          <div>
            <p className="lq-ach__summary">{legend.summary}</p>
            <Stats e={legend} />
            <a className="lq-link" href={legend.source} target="_blank" rel="noopener noreferrer">
              Ver la publicación en Instagram
            </a>
          </div>
          <div className="lq-ach__shots">
            {legend.photos.map((id) => (
              <Thumb key={id} id={id} size={192} />
            ))}
          </div>
        </div>
      </article>

      <ol className="lq-ach__list">
        {rest.map((e) => {
          const a = ACHIEVEMENTS[e.id];
          return (
            <li key={e.id} className={`lq-frame lq-ach__item lq-ach__item--${a?.rarity ?? "raro"}`}>
              <PixelIcon name={a?.icon ?? "mountain"} size={64} className="lq-ach__icon" />
              <div className="lq-ach__body">
                <p className="lq-ach__meta">
                  <span className={`lq-rarity lq-rarity--${a?.rarity ?? "raro"}`}>{RARITY_LABEL[a?.rarity ?? "raro"]}</span>
                  <span>{e.dateLabel}</span>
                  {e.night && <span>Con frontal</span>}
                </p>
                <h3 className="lq-ach__name">{a?.name ?? e.title}</h3>
                <p className="lq-ach__event">
                  {e.title} · {e.place}
                </p>
                <p className="lq-ach__summary">{e.summary}</p>
                <Stats e={e} />
                <a className="lq-link" href={e.source} target="_blank" rel="noopener noreferrer">
                  Ver publicación<span className="lq-sr"> de {e.title} en Instagram</span>
                </a>
              </div>
              {e.photos[0] ? (
                <div className="lq-ach__thumb">
                  <Thumb id={e.photos[0]} />
                </div>
              ) : (
                <div className="lq-ach__thumb lq-ach__thumb--none" aria-hidden="true">
                  <span>Sin captura</span>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <p className="lq-frame lq-frame--orange lq-quest">
        <span className="lq-quest__mark" aria-hidden="true">
          !
        </span>
        <span>
          <strong>Misión en curso:</strong> {season.next}
        </span>
      </p>
    </div>
  );
}
