// Small helper to scroll to a section, preferring the active Lenis instance
// (exposed on window by SmoothScroll) and falling back to native behaviour.

type LenisLike = {
  scrollTo: (
    target: string | number | HTMLElement,
    opts?: { offset?: number; duration?: number },
  ) => void;
};

declare global {
  interface Window {
    __lenis?: LenisLike;
  }
}

export function scrollToId(id: string, offset = -72) {
  const el = document.getElementById(id);
  if (!el) return;
  if (window.__lenis) {
    window.__lenis.scrollTo(el, { offset, duration: 1.2 });
  } else {
    const y = el.getBoundingClientRect().top + window.scrollY + offset;
    window.scrollTo({ top: y, behavior: "smooth" });
  }
}
