/** Spanish thousands separator for every number (2069 → "2.069"), deterministic on server. */
export function thousands(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Zero-padded ordinal: 1 → "01". */
export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
