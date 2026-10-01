// Printed-matter marks for DORSAL: barcodes, stamps, crop/registration marks,
// small pictograms. All static SVG/HTML, decorative unless stated.
import s from "./dorsal.module.css";

// Code 39 patterns (bar, space, bar, …; 1 = wide). Real, scannable encoding.
const CODE39: Record<string, string> = {
  "0": "000110100",
  "1": "100100001",
  "2": "001100001",
  "3": "101100000",
  "4": "000110001",
  "5": "100110000",
  "6": "001110000",
  "7": "000100101",
  "8": "100100100",
  "9": "001100100",
  A: "100001001",
  B: "001001001",
  C: "101001000",
  D: "000011001",
  E: "100011000",
  F: "001011000",
  G: "000001101",
  H: "100001100",
  I: "001001100",
  J: "000011100",
  K: "100000011",
  L: "001000011",
  M: "101000010",
  N: "000010011",
  O: "100010010",
  P: "001010010",
  Q: "000000111",
  R: "100000110",
  S: "001000110",
  T: "000010110",
  U: "110000001",
  V: "011000001",
  W: "111000000",
  X: "010010001",
  Y: "110010000",
  Z: "011010000",
  "-": "010000101",
  "*": "010010100",
};

export function Barcode({
  value,
  className,
  vertical = false,
}: {
  value: string;
  className?: string;
  vertical?: boolean;
}) {
  const chars = `*${value.toUpperCase()}*`.split("").filter((c) => CODE39[c]);
  const NARROW = 1;
  const WIDE = 3;
  const bars: { x: number; w: number }[] = [];
  let x = 0;
  for (const ch of chars) {
    const pattern = CODE39[ch];
    for (let i = 0; i < 9; i++) {
      const w = pattern[i] === "1" ? WIDE : NARROW;
      if (i % 2 === 0) bars.push({ x, w });
      x += w;
    }
    x += NARROW;
  }
  const total = x - NARROW;
  const H = 40;
  return (
    <svg
      className={className}
      viewBox={vertical ? `0 0 ${H} ${total}` : `0 0 ${total} ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {bars.map((b) =>
        vertical ? (
          <rect key={b.x} x={0} y={b.x} width={H} height={b.w} />
        ) : (
          <rect key={b.x} x={b.x} y={0} width={b.w} height={H} />
        ),
      )}
    </svg>
  );
}

/** Crescent moon pictogram for night races. */
export function Moon({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <path d="M15.5 2.5A10 10 0 1 0 21.5 17 8 8 0 0 1 15.5 2.5Z" />
    </svg>
  );
}

/** Aid-station cup pictogram. */
export function Cup({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 3h16l-2.2 18H6.2L4 3Zm2.3 2 .5 4h10.4l.5-4H6.3Z" />
    </svg>
  );
}

/** Rubber stamp: double rule box, rotated, ink colour from CSS. */
export function Stamp({
  children,
  className,
  tone = "orange",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "orange" | "ink" | "paper";
}) {
  return (
    <span className={`${s.stamp} ${s[`stamp_${tone}`]} ${className ?? ""}`} aria-hidden="true">
      {children}
    </span>
  );
}

/** Printer's crop marks around the corners of a positioned parent. */
export function CropMarks({ className }: { className?: string }) {
  return (
    <span className={`${s.crop} ${className ?? ""}`} aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

/** Registration target. */
export function RegMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <circle cx="20" cy="20" r="11" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="20" cy="20" r="5" />
      <path d="M20 0v40M0 20h40" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

/** Timing-chip antenna block printed on the bib stub. */
export function Chip({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 40" aria-hidden="true" focusable="false">
      <rect x="1.5" y="1.5" width="117" height="37" fill="none" stroke="currentColor" strokeWidth="3" />
      <path
        d="M10 20h8l4-10 8 20 8-20 8 20 8-20 8 20 8-20 8 20 8-20 4 10h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="miter"
      />
      <rect x="52" y="14" width="16" height="12" />
    </svg>
  );
}
