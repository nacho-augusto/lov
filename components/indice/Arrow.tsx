/**
 * Hairline arrows drawn as SVG so they match the 1px rules of the page
 * (the Geist latin subset lacks ← and ↗, which would fall back to a system font).
 */
export function Arrow({
  dir = "up-right",
  className = "ix-arrow",
}: {
  dir?: "up-right" | "left" | "down" | "right";
  className?: string;
}) {
  const d = {
    "up-right": "M4 12 12 4M5.5 4H12v6.5",
    left: "M13 8H3m4.5-4.5L3 8l4.5 4.5",
    right: "M3 8h10M8.5 3.5 13 8l-4.5 4.5",
    down: "M8 3v10m-4.5-4.5L8 13l4.5-4.5",
  }[dir];
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
    >
      <path d={d} />
    </svg>
  );
}
