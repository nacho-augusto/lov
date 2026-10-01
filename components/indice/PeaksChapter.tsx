import { sections } from "@/content";
import { ChapterHead } from "./ChapterHead";
import { chapters, summit } from "./data";
import { PeakTable } from "./PeakTable";

const chapter = chapters[2];

/** 03 — ten Málaga summits, measured against the roof of the province. */
export function PeaksChapter() {
  return (
    <section id={chapter.id} data-chapter={chapter.id} className="ix-wrap ix-chapter" aria-labelledby={`${chapter.id}-titulo`}>
      <ChapterHead chapter={chapter} />

      <div className="ix-grid ix-intro">
        <p className="ix-lead ix-intro__lead" data-reveal>
          {sections.peaks.subtitle}
        </p>
        <p className="ix-intro__note" data-reveal>
          Ordenadas de mayor a menor altitud. La línea bajo cada nombre mide su altura frente a {summit.name}; las
          marcadas con Axarquía son nuestra casa.
        </p>
      </div>

      <PeakTable />
    </section>
  );
}
