"use client";

import { createContext, useContext } from "react";
import type { Lumens } from "./data";

interface HeadlampState {
  /** Current headlamp power. Drives the size/intensity of every beam on the page. */
  lumens: Lumens;
  setLumens: (lm: Lumens) => void;
}

export const HeadlampContext = createContext<HeadlampState>({
  lumens: 300,
  setLumens: () => {},
});

export function useHeadlamp(): HeadlampState {
  return useContext(HeadlampContext);
}
