// Central GSAP registration. Import gsap/plugins from here, never directly,
// so plugins are registered exactly once and only in the browser.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, useGSAP);
  // Keep timelines in sync with Lenis' rAF (see SmoothScroll).
  gsap.ticker.lagSmoothing(0);
}

export { gsap, ScrollTrigger, MotionPathPlugin, useGSAP };
