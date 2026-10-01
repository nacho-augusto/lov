/** Tiny pixel arrow glyph (pixel fonts rarely ship arrows). Decorative. */
const PATH = "M3 0h1v1H3zM2 1h3v1H2zM1 2h5v1H1zM0 3h7v1H0zM2 4h3v3H2z";

export function PixelArrow({
  dir = "up",
  size = 14,
  className,
}: {
  dir?: "up" | "down" | "left" | "right";
  size?: number;
  className?: string;
}) {
  const rot = { up: 0, right: 90, down: 180, left: 270 }[dir];
  return (
    <svg
      viewBox="0 0 7 7"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={className}
      style={{ transform: rot ? `rotate(${rot}deg)` : undefined }}
    >
      <path d={PATH} fill="currentColor" />
    </svg>
  );
}
