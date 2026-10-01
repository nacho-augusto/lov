"use client";

// In-page navigation with a retro "screen wipe": the viewport fades to black in
// four palette steps, we jump, and it fades back. Reduced motion: instant jump.

import { prefersReducedMotion } from "./store";

let busy = false;

function focusTarget(el: HTMLElement) {
  const target = el.querySelector<HTMLElement>("[data-lq-focus]") ?? el;
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
}

export function goTo(id: string, after?: () => void) {
  const el = document.getElementById(id);
  if (!el) return;
  const jump = () => {
    const top = id === "inicio" ? 0 : el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: "instant" as ScrollBehavior });
    if (id !== "inicio") focusTarget(el);
  };
  const wipe = document.getElementById("lq-wipe");
  if (prefersReducedMotion() || !wipe || busy) {
    jump();
    after?.();
    return;
  }
  busy = true;
  wipe.dataset.phase = "in";
  window.setTimeout(() => {
    jump();
    wipe.dataset.phase = "out";
    window.setTimeout(() => {
      wipe.dataset.phase = "";
      busy = false;
      after?.();
    }, 260);
  }, 260);
}
