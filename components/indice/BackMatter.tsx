import { club, season } from "@/content";
import { ChapterHead } from "./ChapterHead";
import { appendix, fmtInt, glossary, placeCount, placeGroups, plates, summit, SUMMIT_M } from "./data";
import { IndexLink } from "./IndexLink";

/**
 * Back matter, as in any well-made book: A. glossary, B. index of places with
 * live cross-references, C. colophon (with the club's real mark as the printer's device).
 */
export function BackMatter() {
  return (
    <section id={appendix.id} data-chapter={appendix.id} className="ix-wrap ix-chapter ix-back" aria-labelledby={`${appendix.id}-titulo`}>
      <ChapterHead chapter={appendix} />

      <div className="ix-grid ix-part">
        <div className="ix-part__head" data-reveal>
          <p className="ix-part__n">A</p>
          <h3 className="ix-part__t">Glosario</h3>
          <p className="ix-part__d">Palabras que se oyen en la sierra.</p>
        </div>
        <dl className="ix-gloss">
          {glossary.map((g, i) => (
            <div key={g.term} className="ix-gloss__item" data-reveal="row" style={{ "--d": `${(i % 2) * 60}ms` } as React.CSSProperties}>
              <dt>{g.term}</dt>
              <dd>{g.def}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="ix-grid ix-part">
        <div className="ix-part__head" data-reveal>
          <p className="ix-part__n">B</p>
          <h3 className="ix-part__t">Índice de lugares</h3>
          <p className="ix-part__d">
            {placeCount} topónimos. Los números remiten a la temporada (02) y a las cumbres (03).
          </p>
        </div>
        <div className="ix-places" data-reveal>
          {placeGroups.map((g) => (
            <div key={g.letter} className="ix-places__group">
              <p className="ix-places__letter" aria-hidden="true">
                {g.letter}
              </p>
              <ul>
                {g.places.map((p) => (
                  <li key={p.name} className="ix-places__item">
                    <span className="ix-places__name">{p.name}</span>
                    <span className="ix-places__refs">
                      {p.refs.map((r) => (
                        <span key={r.label}>
                          {" "}
                          <IndexLink target={r.target} item className="ix-cap__ref">
                            {r.label}
                          </IndexLink>
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="ix-grid ix-part ix-colophon">
        <div className="ix-part__head" data-reveal>
          <p className="ix-part__n">C</p>
          <h3 className="ix-part__t">Colofón</h3>
        </div>
        <div className="ix-colophon__body" data-reveal>
          <p>
            Este índice se compuso en Geist y Geist Mono, sobre blanco y con un solo punto de color: el sol naranja
            del logotipo del club, que sube contigo desde el nivel del mar hasta los {fmtInt(SUMMIT_M)} m de{" "}
            {summit.name}.
          </p>
          <p>
            La temporada {season.year} se ha reconstruido a partir de las publicaciones del propio club en Instagram,
            de donde proceden también las {plates.length + 1} figuras. Las altitudes de las cumbres siguen fuentes
            públicas.
          </p>
          <p className="ix-colophon__end">Fin de la subida.</p>
        </div>
        <div className="ix-colophon__mark" data-reveal>
          {/* Plain <img>: the real club logo, used as the printer's device. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/logo-mark.png" alt={club.name} width={640} height={195} loading="lazy" />
        </div>
      </div>
    </section>
  );
}
