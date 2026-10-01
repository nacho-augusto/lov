"use client";

import { useEffect, useRef, useState } from "react";
import { club, peaks, season, seasonEvents, seasonStats, values } from "@/content";
import type { FrameName } from "./atlas";
import { AtlasSprite } from "./AtlasSprite";
import { CLASSES, classById, type ClassId, type RunnerClass } from "./classes";
import { PixelCloud, PixelPeaks } from "./PixelPeaks";
import { PixelSun } from "./PixelSun";
import { playSfx } from "./sfx";
import { emit, setSettings, useSettings } from "./store";

function realLife(c: RunnerClass): string {
  switch (c.id) {
    case "ultra": {
      const omd = seasonEvents.find((e) => e.id === "omd-utmb");
      const s = omd?.stats ?? [];
      const get = (label: string) => s.find((x) => x.label.startsWith(label))?.value ?? "";
      return `OMD by UTMB 2026: ${get("Distancia")}, ${get("Desnivel")} y ${get("Tiempo")}. ${get("Finishers")} finishers vertinianos cruzando juntos la meta.`;
    }
    case "noctambulo": {
      const n = seasonStats.find((x) => x.label.toLowerCase().includes("frontal"));
      return `Temporada 2026: ${n?.value ?? "5"} ${n?.label.toLowerCase() ?? "carreras con frontal"}, de la meta nocturna de Ronda al San Antón Trail Festival.`;
    }
    case "cabra": {
      const m = peaks.find((p) => p.id === "la-maroma");
      return m
        ? `${m.name} (${m.elevation.toLocaleString("es-ES")} m), techo de Málaga. ${m.route.split(":")[0]}.`
        : "";
    }
    case "novato": {
      const c2 = peaks.find((p) => p.id === "calamorro");
      return c2 ? `${c2.name} (${c2.elevation} m): ${c2.why.charAt(0).toLowerCase()}${c2.why.slice(1)}` : "";
    }
    default: {
      const n = seasonStats[0];
      return `Temporada ${season.year}: ${n.value} ${n.label.toLowerCase()}, del primer frontal de abril a las nocturnas de agosto.`;
    }
  }
}

const STAT_KEYS = ["esfuerzo", "montana", "comunidad", "aventura"] as const;

export function CharacterSelect() {
  const settings = useSettings();
  const current = classById(settings.classId);
  const [frame, setFrame] = useState(0);
  const radios = useRef<(HTMLButtonElement | null)[]>([]);

  // animated run cycle (idle under reduced motion)
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  const stageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reduced) return;
    let id = 0;
    let visible = false;
    const tick = () => setFrame((f) => (f + 1) % 8);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      window.clearInterval(id);
      if (visible) id = window.setInterval(tick, 95);
    });
    if (stageRef.current) io.observe(stageRef.current);
    return () => {
      io.disconnect();
      window.clearInterval(id);
    };
  }, [reduced]);

  const idx = CLASSES.findIndex((c) => c.id === current.id);
  const select = (id: ClassId, focus = false) => {
    setSettings({ classId: id });
    if (settings.sound) playSfx("menu");
    if (focus) {
      const i = CLASSES.findIndex((c) => c.id === id);
      radios.current[i]?.focus();
    }
  };
  const step = (d: number, focus = false) => select(CLASSES[(idx + d + CLASSES.length) % CLASSES.length].id, focus);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      step(1, true);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      step(-1, true);
    }
  };

  const spriteName = (reduced ? `${current.sprite}_idle` : `${current.sprite}_run${frame}`) as FrameName;

  return (
    <div className="lq-cs">
      <div className="lq-cs__grid">
        {/* portrait window + roster */}
        <div className="lq-cs__left">
          <div className="lq-frame lq-cs__stage" ref={stageRef}>
            <p className="lq-cs__p1" aria-hidden="true">
              P1
            </p>
            <div className="lq-cs__scene" aria-hidden="true">
              <PixelCloud className="lq-cs__cloud lq-cs__cloud--a" />
              <PixelCloud className="lq-cs__cloud lq-cs__cloud--b" />
              <PixelSun r={18} className="lq-cs__sun" />
              <PixelPeaks className="lq-cs__peaks" />
              <div className="lq-cs__hills" />
              <div className="lq-cs__runner">
                <AtlasSprite name={spriteName} scale={6} className="lq-cs__sprite lq-cs__sprite--lg" />
                <AtlasSprite name={spriteName} scale={4} className="lq-cs__sprite lq-cs__sprite--sm" />
              </div>
            </div>
            <div className="lq-cs__arrows">
              <button type="button" className="lq-arrow" onClick={() => step(-1)} aria-label="Personaje anterior">
                <span aria-hidden="true" />
              </button>
              <p className="lq-cs__count">
                {idx + 1}/{CLASSES.length}
              </p>
              <button type="button" className="lq-arrow" onClick={() => step(1)} aria-label="Personaje siguiente">
                <span aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* class roster */}
          <div className="lq-cs__roster" role="radiogroup" aria-label="Clases de personaje" onKeyDown={onKey}>
            {CLASSES.map((c, i) => {
              const on = c.id === current.id;
              return (
                <button
                  key={c.id}
                  ref={(el) => {
                    radios.current[i] = el;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  tabIndex={on ? 0 : -1}
                  className={`lq-cs__slot${on ? " is-on" : ""}`}
                  onClick={() => select(c.id)}
                >
                  <span className="lq-cs__face" aria-hidden="true">
                    <AtlasSprite name={`${c.sprite}_idle` as FrameName} scale={2} />
                  </span>
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* class sheet */}
        <div className="lq-frame lq-cs__sheet" aria-live="polite">
          <p className="lq-cs__role">{current.role}</p>
          <h3 className="lq-cs__name">{current.name}</h3>
          <p className="lq-cs__quote">«{current.quote}»</p>

          <dl className="lq-cs__ability">
            <dt>Habilidad</dt>
            <dd>
              <strong>{current.ability.name}.</strong> {current.ability.desc}
            </dd>
          </dl>

          <ul className="lq-bars" aria-label="Atributos">
            {STAT_KEYS.map((k) => {
              const v = values.find((x) => x.id === k);
              const n = current.stats[k];
              return (
                <li key={k} className="lq-bar">
                  <span className="lq-bar__label">{v?.title ?? k}</span>
                  <span className="lq-bar__track" role="img" aria-label={`${n} de 10`}>
                    {Array.from({ length: 10 }, (_, i) => (
                      <i key={i} className={i < n ? "is-on" : undefined} />
                    ))}
                  </span>
                  <span className="lq-bar__n">{n}</span>
                </li>
              );
            })}
          </ul>
          <p className="lq-cs__note">Comunidad, siempre al máximo: en este juego nadie sube solo.</p>

          <div className="lq-cs__real">
            <p className="lq-cs__real-k">En la vida real</p>
            <p>{realLife(current)}</p>
          </div>

          <div className="lq-cs__foot">
            <p className="lq-cs__game" aria-label={`En el minijuego: ${current.game.hearts} corazones, salto ${Math.round(current.game.jump * 100)} por ciento, velocidad ${Math.round(current.game.speed * 100)} por ciento${current.game.night ? ", de noche" : ""}`}>
              <span>
                {Array.from({ length: current.game.hearts }, (_, i) => (
                  <i key={i} className="lq-heart" />
                ))}
              </span>
              <span>Salto {Math.round(current.game.jump * 100)}%</span>
              <span>Vel. {Math.round(current.game.speed * 100)}%</span>
              {current.game.night && <span>De noche</span>}
            </p>
            <button
              type="button"
              className="lq-btn"
              onClick={() => {
                if (settings.sound) playSfx("select");
                emit("play", { classId: current.id });
              }}
            >
              Jugar con {current.name.split("/")[0]}
            </button>
          </div>
        </div>
      </div>

      {/* guild sheet: the real club */}
      <div className="lq-frame lq-frame--orange lq-guild">
        <h3 className="lq-guild__title">Ficha del gremio</h3>
        <dl className="lq-guild__facts">
          <div>
            <dt>Gremio</dt>
            <dd>{club.name}</dd>
          </div>
          <div>
            <dt>Clase</dt>
            <dd>{club.discipline}</dd>
          </div>
          <div>
            <dt>Base</dt>
            <dd>
              {club.town} · {club.region}
            </dd>
          </div>
          <div>
            <dt>Federación</dt>
            <dd>
              {club.federation} nº {club.federationNumber}
            </dd>
          </div>
          <div>
            <dt>Tipo</dt>
            <dd>{club.igBio}</dd>
          </div>
          <div>
            <dt>Miembros</dt>
            <dd>
              {club.memberTerm.charAt(0).toUpperCase() + club.memberTerm.slice(1)} ({club.nickname})
            </dd>
          </div>
          <div>
            <dt>Rutina</dt>
            <dd>{club.rhythm}</dd>
          </div>
        </dl>
        <div className="lq-guild__code">
          <p className="lq-guild__code-k">Código del gremio</p>
          <ol>
            {values.map((v) => (
              <li key={v.id}>
                <strong>{v.title}.</strong> {v.desc}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
