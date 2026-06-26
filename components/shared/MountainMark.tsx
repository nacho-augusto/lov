import { ridgePath } from "@/lib/mountain";

/**
 * Recolourable inline-SVG version of the club logo's mountain mark
 * (angular snow-capped range + orange semicircular sun behind it).
 * Built from the shared `ridgePoints` so it matches every other mountain on the site.
 */
export function MountainMark({
  className,
  mountain = "currentColor",
  sun = "var(--orange)",
  stroke,
  showSun = true,
  title = "La Otra Vertiente",
}: {
  className?: string;
  mountain?: string;
  sun?: string;
  stroke?: string;
  showSun?: boolean;
  title?: string;
}) {
  const d = ridgePath(100, 46, { closed: true, topPad: 6 });

  return (
    <svg
      viewBox="0 0 100 52"
      className={className}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      {showSun && (
        // Semicircular sun rising behind the right-hand peaks.
        <path d="M 52 46 A 19 19 0 0 1 90 46 Z" fill={sun} />
      )}
      <path
        d={d}
        fill={mountain}
        stroke={stroke ?? "none"}
        strokeWidth={stroke ? 1.6 : 0}
        strokeLinejoin="round"
      />
    </svg>
  );
}
