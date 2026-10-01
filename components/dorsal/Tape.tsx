import { marquee } from "@/content";
import s from "./dorsal.module.css";

/**
 * Course-marking tape ("cinta de balizaje") stretched across a section boundary.
 * Static on purpose: the phrases repeat, nothing moves.
 */
export function Tape({
  tone = "ink",
  tilt = -1.6,
  offset = 0,
}: {
  tone?: "ink" | "orange";
  tilt?: number;
  offset?: number;
}) {
  const phrases = [...marquee.slice(offset), ...marquee.slice(0, offset)];
  const run = [...phrases, ...phrases, ...phrases];
  return (
    <div className={s.tapeAnchor} aria-hidden="true">
      <div className={`${s.tape} ${s[`tape_${tone}`]}`} style={{ rotate: `${tilt}deg` }}>
        {run.map((p, i) => (
          <span key={i} className={s.tapeItem}>
            {p}
            <span className={s.tapeMark}>▲</span>
          </span>
        ))}
      </div>
    </div>
  );
}
