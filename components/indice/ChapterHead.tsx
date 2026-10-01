import type { Chapter } from "./data";
import { Folio } from "./Folio";

/**
 * Chapter opening: a rule drawn across the measure, the chapter number in the
 * margin, the title in light display type and the folio (altitude) on the right.
 */
export function ChapterHead({ chapter }: { chapter: Chapter }) {
  return (
    <div className="ix-grid ix-ch">
      <span className="ix-rule ix-ch__rule" data-reveal="rule" aria-hidden="true" />
      <p className="ix-ch__n" aria-hidden="true">
        {chapter.n}
      </p>
      <h2 className="ix-ch__t" id={`${chapter.id}-titulo`} data-reveal="mask">
        <span className="ix-line">
          <span>{chapter.title}</span>
        </span>
      </h2>
      <Folio id={chapter.id} className="ix-ch__f" />
    </div>
  );
}
