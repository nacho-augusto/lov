"use client";

// Tiny external store for LOV QUEST settings (CRT filter, sound, night mode, class)
// plus a couple of fire-and-forget events shared by the hero, the menu and the
// character select. Persisted to localStorage when available (always try/catch).

import { useSyncExternalStore } from "react";
import { DEFAULT_CLASS, type ClassId } from "./classes";

export interface Settings {
  crt: boolean;
  sound: boolean;
  night: boolean;
  classId: ClassId;
}

const KEY = "lq-settings";
const DEFAULTS: Settings = { crt: true, sound: false, night: false, classId: DEFAULT_CLASS };

let state: Settings = DEFAULTS;
let hydrated = false;
const listeners = new Set<() => void>();

function load() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Settings>;
      state = { ...DEFAULTS, ...parsed };
    }
  } catch {
    /* storage unavailable: keep defaults */
  }
}

function persist() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function getSettings(): Settings {
  load();
  return state;
}

export function setSettings(patch: Partial<Settings>) {
  load();
  state = { ...state, ...patch };
  persist();
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings, () => DEFAULTS);
}

// ---------------- events ----------------

type EventMap = {
  /** Ask the hero to start a run (optionally with a class). */
  play: { classId?: ClassId };
  /** Pause menu opened/closed (the hero pauses a running game). */
  menu: { open: boolean };
  /** Show a global toast (achievements, cheats). */
  toast: { title: string; text?: string; tone?: "gold" | "orange" | "sky" };
};

type Handler<K extends keyof EventMap> = (payload: EventMap[K]) => void;
const handlers = new Map<keyof EventMap, Set<(payload: never) => void>>();

export function on<K extends keyof EventMap>(type: K, fn: Handler<K>) {
  let set = handlers.get(type);
  if (!set) {
    set = new Set();
    handlers.set(type, set);
  }
  set.add(fn as (payload: never) => void);
  return () => {
    set.delete(fn as (payload: never) => void);
  };
}

export function emit<K extends keyof EventMap>(type: K, payload: EventMap[K]) {
  handlers.get(type)?.forEach((fn) => (fn as Handler<K>)(payload));
}

// ---------------- best score ----------------

const BEST_KEY = "lq-best";

export function readBest(): number {
  try {
    const v = Number(window.localStorage.getItem(BEST_KEY));
    return Number.isFinite(v) && v > 0 ? v : 0;
  } catch {
    return 0;
  }
}

export function writeBest(v: number) {
  try {
    window.localStorage.setItem(BEST_KEY, String(Math.round(v)));
  } catch {
    /* ignore */
  }
}

// ---------------- helpers ----------------

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Spanish thousands separator with a dot (2.069), as the club writes it. */
export function fmtInt(n: number): string {
  const s = String(Math.max(0, Math.round(n)));
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function pad(n: number, len: number): string {
  return String(Math.max(0, Math.round(n))).padStart(len, "0");
}
