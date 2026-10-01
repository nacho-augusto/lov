// Scroll-linked effects without layout thrash: an element's document position is
// measured only when something resizes, and each scroll frame just reads scrollY.

export interface ScrollGeom {
  /** element top in document coordinates */
  top: number;
  height: number;
  scrollY: number;
  vh: number;
}

export function trackScroll(el: HTMLElement, onFrame: (g: ScrollGeom) => void): () => void {
  let top = 0;
  let height = 0;
  let raf = 0;

  const run = () => {
    raf = 0;
    onFrame({ top, height, scrollY: window.scrollY, vh: window.innerHeight });
  };
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(run);
  };
  const measure = () => {
    const r = el.getBoundingClientRect();
    top = r.top + window.scrollY;
    height = r.height;
    schedule();
  };

  measure();
  const ro = new ResizeObserver(measure);
  ro.observe(el);
  // anything above can move us (fonts, images): watch the whole page too
  const main = document.getElementById("frontal-main");
  if (main) ro.observe(main);
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", measure);

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", measure);
  };
}
