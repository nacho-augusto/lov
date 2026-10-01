"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { goTo } from "./nav";
import { playSfx } from "./sfx";
import { emit, getSettings, on, setSettings, useSettings } from "./store";

const ITEMS = [
  { id: "inicio", label: "Pantalla de título" },
  { id: "personaje", label: "Selecciona personaje" },
  { id: "mapa", label: "Mapa del mundo" },
  { id: "logros", label: "Logros 2026" },
  { id: "capturas", label: "Capturas" },
  { id: "manual", label: "Manual" },
  { id: "unete", label: "Multijugador" },
  { id: "creditos", label: "Créditos" },
] as const;

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "KeyB", "KeyA"];

interface Toast {
  id: number;
  title: string;
  text?: string;
  tone?: "gold" | "orange" | "sky";
}

/** Global chrome: fixed MENU button + pause menu, screen wipe, CRT filter, toasts, cheat code. */
export function Menu() {
  const settings = useSettings();
  const [open, setOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const btnRef = useRef<HTMLButtonElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const tid = useRef(0);

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    emit("menu", { open: false });
    if (returnFocus) window.setTimeout(() => btnRef.current?.focus({ preventScroll: true }), 0);
  }, []);

  const openMenu = useCallback(() => {
    setOpen(true);
    emit("menu", { open: true });
    if (getSettings().sound) playSfx("menu");
  }, []);

  // focus the first item when opening; the rest of the page goes inert while the dialog is up
  useEffect(() => {
    if (!open) return;
    const first = boxRef.current?.querySelector<HTMLElement>("[data-mi]");
    first?.focus({ preventScroll: true });
    const behind = [document.getElementById("lq-main"), document.querySelector<HTMLElement>(".lq-footer")];
    behind.forEach((el) => el?.setAttribute("inert", ""));
    return () => behind.forEach((el) => el?.removeAttribute("inert"));
  }, [open]);

  // global keys: M opens, Escape toggles (unless a run is in progress), Konami code
  useEffect(() => {
    let seq: string[] = [];
    const down = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      seq = [...seq, e.code].slice(-KONAMI.length);
      if (seq.join() === KONAMI.join()) {
        seq = [];
        const night = !getSettings().night;
        setSettings({ night });
        emit("toast", {
          title: "Truco activado",
          text: night ? "Modo nocturno: frontal encendido" : "Vuelve a salir el sol",
          tone: "sky",
        });
        if (getSettings().sound) playSfx("peak");
        return;
      }
      if (typing) return;
      const playing = !!document.querySelector('.lq-hero[data-state="playing"]');
      if (e.code === "KeyM" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (open) close();
        else openMenu();
      } else if (e.code === "Escape") {
        if (open) {
          e.preventDefault();
          close();
        } else if (!playing && !e.defaultPrevented) {
          openMenu();
        }
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [open, close, openMenu]);

  // toasts from anywhere
  useEffect(
    () =>
      on("toast", (t) => {
        const id = ++tid.current;
        setToasts((l) => [...l.slice(-2), { ...t, id }]);
        window.setTimeout(() => setToasts((l) => l.filter((x) => x.id !== id)), 3400);
      }),
    [],
  );

  const onMenuKey = (e: React.KeyboardEvent) => {
    const items = [...(boxRef.current?.querySelectorAll<HTMLElement>("[data-mi]") ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      items[(i + 1) % items.length]?.focus();
      if (settings.sound) playSfx("menu");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[(i - 1 + items.length) % items.length]?.focus();
      if (settings.sound) playSfx("menu");
    } else if (e.key === "Home") {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      items[items.length - 1]?.focus();
    } else if (e.key === "Tab") {
      // keep focus inside the dialog
      if (!items.length) return;
      if (e.shiftKey && i <= 0) {
        e.preventDefault();
        items[items.length - 1].focus();
      } else if (!e.shiftKey && i === items.length - 1) {
        e.preventDefault();
        items[0].focus();
      }
    }
  };

  const go = (id: string) => {
    close(false);
    if (settings.sound) playSfx("select");
    // wait for the dialog to unmount (and the page to leave `inert`) before moving focus
    window.setTimeout(() => goTo(id), 0);
  };

  const toggle = (k: "crt" | "sound" | "night") => {
    const next = !settings[k];
    setSettings({ [k]: next });
    if ((k === "sound" && next) || settings.sound) playSfx("menu");
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="lq-menubtn"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="lq-pausemenu"
        onClick={() => (open ? close() : openMenu())}
      >
        <span className="lq-menubtn__icon" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        Menú
      </button>

      {open && (
        <div className="lq-pause" onClick={() => close()}>
          <div
            id="lq-pausemenu"
            ref={boxRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="lq-pause-title"
            className="lq-frame lq-pause__box"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={onMenuKey}
          >
            <h2 id="lq-pause-title" className="lq-pause__title">
              Pausa
            </h2>
            <nav aria-label="Pantallas">
              <ul className="lq-pause__list">
                <li>
                  <button type="button" data-mi className="lq-cursor" onClick={() => close()}>
                    Continuar
                  </button>
                </li>
                {ITEMS.map((it) => (
                  <li key={it.id}>
                    <button type="button" data-mi className="lq-cursor" onClick={() => go(it.id)}>
                      {it.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            <p className="lq-pause__sub">Opciones</p>
            <ul className="lq-pause__list lq-pause__list--opts">
              {(
                [
                  ["crt", "Filtro CRT"],
                  ["sound", "Sonido"],
                  ["night", "Modo nocturno"],
                ] as const
              ).map(([k, label]) => (
                <li key={k}>
                  <button type="button" data-mi className="lq-cursor lq-opt" role="switch" aria-checked={settings[k]} onClick={() => toggle(k)}>
                    <span>{label}</span>
                    <span className="lq-opt__v">{settings[k] ? "Sí" : "No"}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="lq-pause__foot">
              <Link href="/" data-mi className="lq-cursor lq-pause__exit">
                ← Todas las versiones
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* retro screen wipe used by in-page navigation */}
      <div id="lq-wipe" className="lq-wipe" data-phase="" aria-hidden="true" />

      {/* optional CRT scanlines (decorative) */}
      {settings.crt && <div className="lq-crt" aria-hidden="true" />}

      {/* app-wide toasts */}
      <div className="lq-gtoasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`lq-gtoast lq-gtoast--${t.tone ?? "orange"}`}>
            <span className="lq-gtoast__icon" aria-hidden="true" />
            <span>
              <strong>{t.title}</strong>
              {t.text && <span>{t.text}</span>}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
