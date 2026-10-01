import { sectionNumber, type SectionId } from "./copy";
import s from "./dorsal.module.css";

/**
 * Running head + full-width poster title. `fit` is the title's advance width in
 * ems at the chosen width axis, so the word spans exactly the container
 * (font-size = 100cqw / fit).
 */
export function SectionHead({
  id,
  title,
  fit,
  note,
  width = "xt",
}: {
  id: SectionId;
  title: string;
  fit: number;
  note: string;
  width?: "xt" | "cn";
}) {
  return (
    <header className={s.secHead}>
      <div className={s.runHead}>
        <span className={s.runNo}>{sectionNumber(id)}</span>
        <span className={s.runRule} aria-hidden="true" />
        <span className={s.runNote}>{note}</span>
      </div>
      <h2
        id={`${id}-title`}
        className={`${s.secTitle} ${width === "cn" ? s.secTitleCn : ""} ${
          /[ÁÉÍÓÚÑ]/i.test(title) ? s.secTitleAccent : ""
        }`}
        style={{ "--fit": fit } as React.CSSProperties}
      >
        {title}
      </h2>
    </header>
  );
}
