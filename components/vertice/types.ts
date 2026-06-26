export interface VerticeProgress {
  /** normalized scroll progress 0..1 (= altitude band) */
  p: number;
  /** ScrollTrigger direction: 1 ascending (scroll down), -1 descending */
  dir: number;
  /** raw scroll velocity */
  vel: number;
}

export const SUMMIT_M = 2069; // La Maroma — the altimeter target
