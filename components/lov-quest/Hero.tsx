"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { club } from "@/content";
import { LOGO_SIZE } from "./atlas";
import { classById } from "./classes";
import { LqEngine, type GameState, type Hud, type OverInfo } from "./engine";
import { playSfx } from "./sfx";
import { fmtInt, getSettings, on, pad, prefersReducedMotion, readBest, setSettings, useSettings, writeBest } from "./store";
import { goTo } from "./nav";
import { PixelArrow } from "./PixelArrow";

interface Toast {
  id: number;
  title: string;
  text?: string;
  tone: "gold" | "orange" | "sky";
}

const MAX_ALT = 2069;

export function Hero() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<LqEngine | null>(null);
  const altRef = useRef<HTMLSpanElement>(null);
  const kmRef = useRef<HTMLSpanElement>(null);
  const ptsRef = useRef<HTMLSpanElement>(null);
  const goalNameRef = useRef<HTMLSpanElement>(null);
  const goalBarRef = useRef<HTMLSpanElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);
  const againRef = useRef<HTMLButtonElement>(null);
  const resumeRef = useRef<HTMLButtonElement>(null);
  const toastId = useRef(0);

  const settings = useSettings();
  const cls = classById(settings.classId);

  const [state, setState] = useState<GameState>("title");
  const [over, setOver] = useState<OverInfo | null>(null);
  const [hearts, setHearts] = useState({ n: cls.game.hearts, max: cls.game.hearts });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [layout, setLayout] = useState({ px: 4, logo: 6 });
  const [best, setBest] = useState(0);
  const [announce, setAnnounce] = useState("");
  const [hint, setHint] = useState(false);

  const soundOn = useRef(settings.sound);
  useEffect(() => {
    soundOn.current = settings.sound;
  }, [settings.sound]);

  const pushToast = useCallback((t: Omit<Toast, "id">) => {
    const id = ++toastId.current;
    setToasts((list) => [...list.slice(-1), { ...t, id }]);
    window.setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), 2800);
  }, []);

  // ---- engine lifecycle -------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const s = getSettings();
    const initialBest = readBest();
    setBest(initialBest);
    let engine: LqEngine;
    try {
      engine = new LqEngine(
        canvas,
        {
          state: (st, info) => {
            setState(st);
            if (st === "over" && info) {
              setOver(info);
              if (info.newBest) writeBest(info.alt);
              setBest(info.best);
              setAnnounce(`Fin de la partida. Has subido ${fmtInt(info.alt)} metros. ¿Otra subida?`);
            } else if (st === "playing") {
              setAnnounce("Partida en marcha. Salta con espacio, flecha arriba o tocando la pantalla. P para pausar.");
            } else if (st === "paused") {
              setAnnounce("Partida en pausa.");
            }
          },
          hud: (h: Hud) => {
            if (altRef.current) altRef.current.textContent = pad(h.alt, 4);
            if (kmRef.current) kmRef.current.textContent = h.km.toFixed(1).replace(".", ",").padStart(4, "0");
            if (ptsRef.current) ptsRef.current.textContent = pad(h.points, 6);
            if (goalNameRef.current) {
              goalNameRef.current.textContent = h.goal ? `${h.goal.name} · ${fmtInt(h.goal.alt)} m` : "Modo infinito";
            }
            if (goalBarRef.current) {
              const g = h.goal;
              const f = g ? Math.max(0, Math.min(1, (h.alt - g.from) / Math.max(1, g.alt - g.from))) : 1;
              goalBarRef.current.style.setProperty("--f", f.toFixed(3));
            }
            setHearts((prev) => (prev.n === h.hearts && prev.max === h.maxHearts ? prev : { n: h.hearts, max: h.maxHearts }));
          },
          toast: (t) => pushToast(t),
          sfx: (name) => {
            if (soundOn.current) playSfx(name);
          },
          layout: ({ scale }) => {
            const dpr = Math.min(3, window.devicePixelRatio || 1);
            const cssW = wrap.clientWidth;
            const maxW = cssW < 700 ? cssW * 0.84 : Math.min(cssW * 0.5, 760);
            const n = Math.max(1, Math.floor((maxW * dpr) / LOGO_SIZE[0]));
            setLayout({ px: scale, logo: n / dpr });
          },
        },
        {
          reduced: prefersReducedMotion(),
          cls: classById(s.classId),
          night: s.night,
          best: initialBest,
        },
      );
    } catch {
      return;
    }
    engineRef.current = engine;
    engine.setNight(s.night);

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      engine.resize(r.width, r.height, Math.min(3, window.devicePixelRatio || 1));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let inView = true;
    const io = new IntersectionObserver(
      ([e]) => {
        inView = e.isIntersecting && e.intersectionRatio > 0.12;
        engine.setVisible(inView && !document.hidden);
      },
      { threshold: [0, 0.12, 0.3] },
    );
    io.observe(wrap);
    const onVis = () => engine.setVisible(inView && !document.hidden);
    document.addEventListener("visibilitychange", onVis);
    // switching windows mid-run pauses too (the page stays visible, so visibilitychange won't fire)
    const onBlur = () => engine.pause();
    window.addEventListener("blur", onBlur);

    const onScroll = () => {
      const y = window.scrollY;
      engine.setScroll(y);
      if (engine.getState() === "title" && altRef.current) {
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        altRef.current.textContent = pad((y / max) * MAX_ALT, 4);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMq = () => engine.setReduced(mq.matches);
    mq.addEventListener("change", onMq);

    return () => {
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("scroll", onScroll);
      mq.removeEventListener("change", onMq);
      engine.destroy();
      engineRef.current = null;
    };
  }, [pushToast]);

  // keep engine in sync with settings
  useEffect(() => {
    const e = engineRef.current;
    if (!e) return;
    e.setClass(cls);
    e.setNight(settings.night);
    if (e.getState() !== "playing") setHearts({ n: cls.game.hearts, max: cls.game.hearts });
  }, [cls, settings.night]);

  // ---- actions ------------------------------------------------------------
  const start = useCallback(() => {
    const e = engineRef.current;
    if (!e) return;
    setOver(null);
    e.start();
    setHint(true);
    window.setTimeout(() => setHint(false), 3200);
    wrapRef.current?.focus({ preventScroll: true });
  }, []);

  const toTitle = useCallback(() => {
    engineRef.current?.toTitle();
    setOver(null);
    window.setTimeout(() => startRef.current?.focus({ preventScroll: true }), 30);
  }, []);

  // external requests: "play" from the character select, menu open/close
  useEffect(() => {
    const offPlay = on("play", ({ classId }) => {
      if (classId) setSettings({ classId });
      goTo("inicio", () => {
        window.setTimeout(() => start(), 60);
      });
    });
    const offMenu = on("menu", ({ open }) => {
      if (open) engineRef.current?.pause();
    });
    return () => {
      offPlay();
      offMenu();
    };
  }, [start]);

  // focus management on state changes
  useEffect(() => {
    if (state === "over") window.setTimeout(() => againRef.current?.focus({ preventScroll: true }), 900);
    if (state === "paused") resumeRef.current?.focus({ preventScroll: true });
  }, [state]);

  // keyboard: Space/↑/W jump only while playing (and only then do we preventDefault)
  useEffect(() => {
    const isField = (t: EventTarget | null) =>
      t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    const down = (ev: KeyboardEvent) => {
      const e = engineRef.current;
      if (!e || isField(ev.target)) return;
      const st = e.getState();
      if (st === "playing") {
        if (ev.code === "Space" || ev.code === "ArrowUp" || ev.code === "KeyW") {
          ev.preventDefault();
          if (!ev.repeat) e.jumpDown();
        } else if (ev.code === "KeyP" || ev.code === "Escape") {
          ev.preventDefault();
          e.pause();
        }
      } else if (st === "paused") {
        if (ev.code === "KeyP") {
          ev.preventDefault();
          e.resume();
        }
      } else if (st === "title" && (ev.code === "Enter" || ev.code === "Space")) {
        const t = ev.target as HTMLElement | null;
        const onPage = !t || t === document.body || t === wrapRef.current;
        if (onPage && wrapRef.current) {
          const r = wrapRef.current.getBoundingClientRect();
          // Enter works while the title is mostly visible; Space only at the very top
          const ok = ev.code === "Enter" ? r.bottom > window.innerHeight * 0.4 : window.scrollY < 40;
          if (ok) {
            ev.preventDefault();
            start();
          }
        }
      }
    };
    const up = (ev: KeyboardEvent) => {
      if (ev.code === "Space" || ev.code === "ArrowUp" || ev.code === "KeyW") engineRef.current?.jumpUp();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [start]);

  const onPointerDown = (ev: React.PointerEvent) => {
    const e = engineRef.current;
    if (!e || e.getState() !== "playing") return;
    if ((ev.target as HTMLElement).closest("button, a")) return;
    e.jumpDown();
  };
  const onPointerUp = () => engineRef.current?.jumpUp();
  const onStageClick = (ev: React.MouseEvent) => {
    const e = engineRef.current;
    if (!e || e.getState() !== "title") return;
    if ((ev.target as HTMLElement).closest("button, a, h1, p")) return;
    start();
  };

  const playing = state === "playing";
  const heartsArr = Array.from({ length: hearts.max }, (_, i) => i < hearts.n);

  return (
    <section
      id="inicio"
      aria-labelledby="lq-title"
      className="lq-hero"
      data-state={state}
      style={{ "--px": `${layout.px}px`, "--logo-px": `${layout.logo}px` } as React.CSSProperties}
    >
      <div
        ref={wrapRef}
        className="lq-hero__stage"
        tabIndex={-1}
        aria-describedby="lq-controls"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerUp}
        onClick={onStageClick}
      >
        <canvas ref={canvasRef} className="lq-hero__canvas" aria-hidden="true" />

        {/* HUD */}
        <div className="lq-hud" aria-hidden={!playing}>
          <div className="lq-hud__cell">
            <span className="lq-hud__label">Altitud</span>
            <span className="lq-hud__value">
              <span ref={altRef}>0000</span>
              <small> m</small>
            </span>
          </div>
          <div className="lq-hud__cell">
            <span className="lq-hud__label">Km</span>
            <span className="lq-hud__value">
              <span ref={kmRef}>00,0</span>
            </span>
          </div>
          <div className="lq-hud__cell">
            <span className="lq-hud__label">Vidas</span>
            <span className="lq-hud__hearts" aria-label={`${hearts.n} de ${hearts.max} corazones`}>
              {heartsArr.map((full, i) => (
                <i key={i} className={full ? "lq-heart" : "lq-heart lq-heart--empty"} />
              ))}
            </span>
          </div>
          <div className="lq-hud__cell lq-hud__cell--pts">
            <span className="lq-hud__label">Puntos</span>
            <span className="lq-hud__value">
              <span ref={ptsRef}>000000</span>
            </span>
          </div>
        </div>

        {/* next summit while running */}
        <div className="lq-goal" aria-hidden="true" hidden={state === "title"}>
          <span className="lq-goal__k">Próxima cumbre</span>
          <span className="lq-goal__name" ref={goalNameRef}>
            Calamorro · 771 m
          </span>
          <span className="lq-goal__bar" ref={goalBarRef} />
        </div>

        {/* TITLE SCREEN */}
        <div className="lq-title" hidden={state !== "title"}>
          <h1 id="lq-title" className="lq-title__logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/lov-quest/logo.png"
              width={LOGO_SIZE[0]}
              height={LOGO_SIZE[1]}
              alt="La Otra Vertiente"
              draggable={false}
            />
            <span className="lq-title__sub">El videojuego</span>
          </h1>
          <p className="lq-title__tagline">{club.tagline}</p>
          <p className="lq-title__press" aria-hidden="true">
            Pulsa start
          </p>
          <div className="lq-title__box">
          <ul className="lq-title__menu" aria-label="Menú de inicio">
            <li>
              <button ref={startRef} type="button" className="lq-cursor" onClick={start}>
                1 jugador
              </button>
            </li>
            <li>
              <button type="button" className="lq-cursor" onClick={() => goTo("unete")}>
                2 jugadores
              </button>
            </li>
            <li>
              <button type="button" className="lq-cursor" onClick={() => goTo("personaje")}>
                Elegir personaje
              </button>
            </li>
          </ul>
          <p className="lq-title__meta">
            <span>Récord {fmtInt(best)} m</span>
            <span>Personaje: {cls.name}</span>
          </p>
          </div>
        </div>

        {/* controls hint while playing */}
        {playing && hint && (
          <p className="lq-hint" aria-hidden="true">
            Espacio · ↑ · toca para saltar
          </p>
        )}

        {playing && (
          <button type="button" className="lq-pausebtn" onClick={() => engineRef.current?.pause()}>
            <span aria-hidden="true">II</span> Pausa
          </button>
        )}

        {/* PAUSE */}
        {state === "paused" && (
          <div className="lq-modal" role="dialog" aria-modal="false" aria-labelledby="lq-pause-t">
            <div className="lq-frame lq-modal__box">
              <h2 id="lq-pause-t" className="lq-modal__title">
                Pausa
              </h2>
              <p className="lq-modal__text">Respira. La montaña sigue ahí.</p>
              <div className="lq-modal__actions">
                <button ref={resumeRef} type="button" className="lq-btn" onClick={() => engineRef.current?.resume()}>
                  Continuar
                </button>
                <button type="button" className="lq-btn lq-btn--ghost" onClick={toTitle}>
                  Salir al título
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GAME OVER */}
        {state === "over" && over && (
          <div className="lq-modal lq-modal--over" role="dialog" aria-modal="false" aria-labelledby="lq-over-t">
            <div className="lq-frame lq-modal__box">
              <p className="lq-modal__kicker">Fin de la partida</p>
              <h2 id="lq-over-t" className="lq-modal__title">
                ¿Otra subida?
              </h2>
              <dl className="lq-over__stats">
                <div>
                  <dt>Altitud</dt>
                  <dd>{fmtInt(over.alt)} m</dd>
                </div>
                <div>
                  <dt>Km</dt>
                  <dd>{over.km.toFixed(1).replace(".", ",")}</dd>
                </div>
                <div>
                  <dt>Puntos</dt>
                  <dd>{fmtInt(over.points)}</dd>
                </div>
              </dl>
              <p className="lq-modal__text">
                {over.lastPeak ? <>Última cumbre: {over.lastPeak}.</> : <>Ni el Calamorro esta vez: 771 m te esperan.</>}
                {over.newBest && <strong className="lq-newbest"> ¡Nuevo récord!</strong>}
              </p>
              <div className="lq-modal__actions">
                <button ref={againRef} type="button" className="lq-btn" onClick={start}>
                  Sí, otra
                </button>
                <button
                  type="button"
                  className="lq-btn lq-btn--ghost"
                  onClick={() => {
                    toTitle();
                    goTo("personaje");
                  }}
                >
                  No, ver el club
                </button>
              </div>
            </div>
          </div>
        )}

        {/* toasts */}
        <div className="lq-toasts" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className={`lq-toast lq-toast--${t.tone}`}>
              <strong>{t.title}</strong>
              {t.text && <span>{t.text}</span>}
            </div>
          ))}
        </div>

        <p id="lq-controls" className="lq-sr">
          Minijuego de trail running. Pulsa «1 jugador», Intro o toca el escenario para empezar. Salta con la barra
          espaciadora, la flecha arriba o tocando la pantalla; mantén para saltar más alto. P o Escape pausan la
          partida.
        </p>
        <p className="lq-sr" aria-live="assertive">
          {announce}
        </p>

        <a href="#personaje" className="lq-scrollcue" onClick={(e) => { e.preventDefault(); goTo("personaje"); }}>
          <PixelArrow dir="down" size={12} /> Baja para subir
        </a>
      </div>
    </section>
  );
}
