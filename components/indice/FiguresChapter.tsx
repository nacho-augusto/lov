import { season } from "@/content";
import { ChapterHead } from "./ChapterHead";
import { chapters } from "./data";
import { Plates } from "./Plates";

const chapter = chapters[3];

/** 04 — photography, printed as numbered plates. */
export function FiguresChapter() {
  return (
    <section id={chapter.id} data-chapter={chapter.id} className="ix-wrap ix-chapter" aria-labelledby={`${chapter.id}-titulo`}>
      <ChapterHead chapter={chapter} />

      <div className="ix-grid ix-intro">
        <p className="ix-lead ix-intro__lead" data-reveal>
          Láminas de la temporada {season.year}, tal como las publicó el club. En blanco y negro hasta que las miras.
        </p>
        <p className="ix-intro__note" data-reveal>
          Pulsa una lámina para verla a tamaño completo; con las flechas del teclado pasas a la siguiente.
        </p>
      </div>

      <Plates />
    </section>
  );
}
