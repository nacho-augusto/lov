"use client";

import { useEffect, useState } from "react";

/**
 * Returns whether the browser can run our WebGL scenes.
 * `null` while undetermined (SSR / first paint), then a boolean.
 * Also returns false under prefers-reduced-motion so 3D directions fall back.
 */
export function useWebGLSupport(): boolean | null {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) {
      setSupported(false);
      return;
    }
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl");
      setSupported(!!gl);
    } catch {
      setSupported(false);
    }
  }, []);

  return supported;
}
