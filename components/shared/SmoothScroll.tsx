"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Initialises Lenis smooth scroll once and bridges it to the GSAP ticker and
 * ScrollTrigger. Under prefers-reduced-motion we skip Lenis entirely and let the
 * browser scroll natively, so scrubbed timelines snap to position without inertia.
 */
export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) {
      ScrollTrigger.refresh();
      return;
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });

    lenis.on("scroll", ScrollTrigger.update);
    window.__lenis = lenis;

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Let ScrollTrigger recompute once layout + fonts settle.
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    const t = window.setTimeout(refresh, 400);

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("load", refresh);
      window.clearTimeout(t);
      delete window.__lenis;
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
