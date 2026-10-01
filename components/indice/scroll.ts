// ÍNDICE — scroll plumbing shared by the client islands.
// - One passive scroll listener feeds every subscriber the page progress (0–1),
//   which the altitude rail and the header turn into metres.
// - "Folios": where each chapter sits on that climb (its page number, in metres).
// - go(): smooth scroll (Lenis when present) + an event so lists can open an item.

import { useSyncExternalStore } from "react";
import { scrollToId } from "@/lib/scroll";
import { SUMMIT_M } from "./data";

/* ----------------------------------------------------------------- progress */

type ProgressListener = (p: number) => void;
const progressListeners = new Set<ProgressListener>();
let raf = 0;
let resizeObs: ResizeObserver | null = null;

function readProgress(): number {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
}

function flush() {
  raf = 0;
  const p = readProgress();
  progressListeners.forEach((l) => l(p));
  folioDirty();
}

function schedule() {
  if (!raf) raf = requestAnimationFrame(flush);
}

/** Subscribe to page progress; returns the unsubscribe function. */
export function subscribeProgress(listener: ProgressListener): () => void {
  progressListeners.add(listener);
  if (progressListeners.size === 1) {
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // Accordions change the page height without scrolling: re-read then too.
    resizeObs = new ResizeObserver(schedule);
    resizeObs.observe(document.body);
  }
  listener(readProgress());
  return () => {
    progressListeners.delete(listener);
    if (progressListeners.size === 0) {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      resizeObs?.disconnect();
      resizeObs = null;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }
  };
}

export const toMetres = (p: number) => Math.round(p * SUMMIT_M);

/* ------------------------------------------------------------------- folios */

export type Folios = Record<string, number>;

let folios: Folios | null = null;
let folioKey = "";
let folioTimer = 0;
const folioListeners = new Set<() => void>();

/** Page scroll-padding-top (Lenis and anchor jumps both honour it). */
function scrollPadding(): number {
  const v = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
  return Number.isNaN(v) ? 0 : v;
}

/** Altitude (m) the rail shows when you land on each `[data-chapter]`. */
function computeFolios() {
  folioTimer = 0;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const pad = scrollPadding();
  const next: Folios = {};
  document.querySelectorAll<HTMLElement>("[data-chapter]").forEach((el) => {
    const id = el.dataset.chapter ?? "";
    const top = el.getBoundingClientRect().top + window.scrollY - pad;
    next[id] = toMetres(max > 0 ? Math.min(1, Math.max(0, top / max)) : 0);
  });
  const key = JSON.stringify(next);
  if (key !== folioKey) {
    folioKey = key;
    folios = next;
    folioListeners.forEach((l) => l());
  }
}

function folioDirty() {
  if (!folioListeners.size) return;
  window.clearTimeout(folioTimer);
  folioTimer = window.setTimeout(computeFolios, 120);
}

function subscribeFolios(cb: () => void) {
  folioListeners.add(cb);
  const unsub = subscribeProgress(() => {});
  // First measure after layout and fonts settle.
  folioDirty();
  if (document.fonts?.ready) document.fonts.ready.then(folioDirty);
  return () => {
    folioListeners.delete(cb);
    unsub();
  };
}

/** Chapter altitudes, or null until measured (also null on the server). */
export function useFolios(): Folios | null {
  return useSyncExternalStore(
    subscribeFolios,
    () => folios,
    () => null,
  );
}

/* ------------------------------------------------------------------ go-to */

export const ITEM_EVENT = "ix:item";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Scroll to an element id. `item` asks lists (season, peaks) to open/select it.
 * Chapters land flush with the viewport top; items keep some air above them.
 */
export function go(id: string, opts: { item?: boolean } = {}) {
  const offset = opts.item ? -Math.round(window.innerHeight * 0.22) : 0;
  if (prefersReducedMotion() || !window.__lenis) {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY + offset - scrollPadding();
      window.scrollTo({ top: y, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    }
  } else {
    scrollToId(id, offset);
  }
  if (opts.item) window.dispatchEvent(new CustomEvent<string>(ITEM_EVENT, { detail: id }));
}

/** Lenis exposes stop/start; the shared type only declares scrollTo. */
export function lockScroll(locked: boolean) {
  const lenis = window.__lenis as unknown as { stop?: () => void; start?: () => void } | undefined;
  if (locked) lenis?.stop?.();
  else lenis?.start?.();
}
