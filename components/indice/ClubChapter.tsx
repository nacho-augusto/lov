import { club, values } from "@/content";
import { ChapterHead } from "./ChapterHead";
import { chapters } from "./data";

const chapter = chapters[0];

/** 01 — a manifesto set large and light, the principles, and a data sheet. */
export function ClubChapter() {
  const ficha: [string, React.ReactNode][] = [
    ["Nombre", club.name],
    ["Sede", `${club.town}, ${club.province}`],
    ["Zona", club.region.replace(" · ", ", ")],
    ["Disciplina", club.discipline],
    ["Federación", `${club.federation}, nº ${club.federationNumber}`],
    ["Gentilicio", club.memberTerm],
    [
      "Instagram",
      <a key="ig" className="ix-link" href={club.instagram} target="_blank" rel="noopener noreferrer">
        {club.instagramHandle}
      </a>,
    ],
  ];

  return (
    <section id={chapter.id} data-chapter={chapter.id} className="ix-wrap ix-chapter" aria-labelledby={`${chapter.id}-titulo`}>
      <ChapterHead chapter={chapter} />

      <div className="ix-grid ix-club">
        <p className="ix-manifesto" data-reveal>
          {club.tagline} Salimos del nivel del mar, en {club.town}, y subimos en grupo —de día y de
          noche— hasta donde nos lleven las piernas.
        </p>

        <div className="ix-club__body" data-reveal>
          <p>
            Somos un {club.legalType.toLowerCase()} de actividades de montaña, federado en{" "}
            {club.federation}. {club.rhythm}
          </p>
          <p>
            Nos llamamos {club.memberTerm}. Lo que nos une no es el ritmo: es la subida, y esperarnos
            arriba.
          </p>
        </div>

        <div className="ix-club__ficha" data-reveal>
          <h3 className="ix-label">Ficha</h3>
          <dl className="ix-dl">
            {ficha.map(([k, v]) => (
              <div key={k} className="ix-dl__row">
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="ix-grid ix-principles">
        <h3 className="ix-label ix-principles__label" data-reveal>
          Principios
        </h3>
        <ol className="ix-principles__list">
          {values.map((v, i) => (
            <li key={v.id} className="ix-principle" data-reveal="row" style={{ "--d": `${i * 80}ms` } as React.CSSProperties}>
              <span className="ix-principle__n">1.{i + 1}</span>
              <span className="ix-principle__t">{v.title}</span>
              <span className="ix-principle__d">{v.desc}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
