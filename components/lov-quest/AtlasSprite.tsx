import { ATLAS_SIZE, FRAMES, type FrameName } from "./atlas";

/** An atlas frame as a crisp, integer-scaled CSS sprite (decorative). */
export function AtlasSprite({
  name,
  scale = 4,
  className,
  flip = false,
}: {
  name: FrameName;
  scale?: number;
  className?: string;
  flip?: boolean;
}) {
  const [x, y, w, h] = FRAMES[name];
  return (
    <span
      aria-hidden="true"
      className={`lq-sprite${className ? ` ${className}` : ""}`}
      style={{
        width: w * scale,
        height: h * scale,
        backgroundPosition: `${-x * scale}px ${-y * scale}px`,
        backgroundSize: `${ATLAS_SIZE[0] * scale}px ${ATLAS_SIZE[1] * scale}px`,
        transform: flip ? "scaleX(-1)" : undefined,
      }}
    />
  );
}
