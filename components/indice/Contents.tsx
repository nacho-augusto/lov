"use client";

import { allChapters, fmtInt, summit, SUMMIT_M } from "./data";
import { go, useFolios } from "./scroll";

/**
 * The table of contents. Its page numbers are metres: where each chapter sits
 * on the climb from sea level to the roof of Málaga (measured live, so they
 * match the altitude rail exactly).
 */
export function Contents() {
  const folios = useFolios();
  return (
    <section id="indice" className="ix-wrap ix-toc" aria-labelledby="ix-indice-titulo">
      <div className="ix-grid ix-toc__head">
        <h2 id="ix-indice-titulo" className="ix-label ix-toc__label" data-reveal>
          Índice
        </h2>
        <p className="ix-toc__note" data-reveal>
          Este índice se lee subiendo. En lugar de páginas, metros: del nivel del mar en Rincón de la
          Victoria a los {fmtInt(SUMMIT_M)} m de {summit.name}, el techo de Málaga.
        </p>
      </div>

      <ol className="ix-toc__list">
        {allChapters.map((c, i) => {
          const m = folios?.[c.id];
          return (
            <li key={c.id} className="ix-toc__row" data-reveal="row" style={{ "--d": `${i * 70}ms` } as React.CSSProperties}>
              <a
                href={`#${c.id}`}
                className="ix-grid ix-toc__link"
                onClick={(e) => {
                  e.preventDefault();
                  go(c.id);
                }}
              >
                <span className="ix-toc__n">
                  <span className="ix-sun" aria-hidden="true" />
                  {c.n}
                </span>{" "}
                <span className="ix-toc__t">{c.title}</span>{" "}
                <span className="ix-toc__d">{c.note}</span>
                <span className="ix-toc__f" data-ready={m === undefined ? undefined : ""} aria-hidden="true">
                  {m === undefined ? " " : `${fmtInt(m)} m`}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
