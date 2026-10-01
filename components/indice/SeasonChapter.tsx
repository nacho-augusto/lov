import { club, season, seasonStats } from "@/content";
import { ChapterHead } from "./ChapterHead";
import { chapters } from "./data";
import { SeasonIndex } from "./SeasonIndex";

const chapter = chapters[1];

/** 02 — the 2026 season, as told by the club's own posts. */
export function SeasonChapter() {
  return (
    <section id={chapter.id} data-chapter={chapter.id} className="ix-wrap ix-chapter" aria-labelledby={`${chapter.id}-titulo`}>
      <ChapterHead chapter={chapter} />

      <div className="ix-grid ix-intro">
        <p className="ix-lead ix-intro__lead" data-reveal>
          {season.intro}
        </p>
        <div className="ix-intro__aside" data-reveal>
          <h3 className="ix-label">Resumen</h3>
          <dl className="ix-dl ix-dl--figures">
            {seasonStats.map((s) => (
              <div key={s.label} className="ix-dl__row">
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <SeasonIndex />

      <div className="ix-grid ix-endnote">
        <p className="ix-endnote__text" data-reveal>
          {season.next}
        </p>
        <p className="ix-endnote__src" data-reveal>
          Fuente: publicaciones del propio club en Instagram ({club.instagramHandle}).
        </p>
      </div>
    </section>
  );
}
