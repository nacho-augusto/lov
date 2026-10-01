import { ICONS, type IconName } from "./icons";
import { PAL } from "./palette";

/** Crisp 16x16 pixel icon rendered as an SVG of merged horizontal runs. */
export function PixelIcon({
  name,
  size = 48,
  className,
  title,
}: {
  name: IconName;
  size?: number;
  className?: string;
  title?: string;
}) {
  const rows = ICONS[name];
  const paths = new Map<string, string>();
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === ".") {
        x++;
        continue;
      }
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      const d = `M${x} ${y}h${end - x}v1h${-(end - x)}z`;
      paths.set(ch, (paths.get(ch) ?? "") + d);
      x = end;
    }
  });
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {[...paths.entries()].map(([ch, d]) => (
        <path key={ch} d={d} fill={PAL[parseInt(ch, 16)]} />
      ))}
    </svg>
  );
}
