import { club, sponsors, sponsorsIntro } from "@/content";
import { Arrow } from "./Arrow";
import { ChapterHead } from "./ChapterHead";
import { chapters } from "./data";

const chapter = chapters[4];

/** "a, b, c y d" — Spanish list joining. */
function listEs(items: string[]): string {
  if (items.length < 2) return items.join("");
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

/**
 * 05 — the club's real channel (Instagram) set as large as the title page,
 * plus how to start. The e-mail in content is still a placeholder, so it only
 * appears small, unlinked and marked "por confirmar".
 */
export function ContactChapter() {
  const steps = [
    "Escríbenos y cuéntanos qué te apetece correr: sierra, nocturnas o tu primera carrera por montaña.",
    "Te contamos cuándo es la próxima salida en grupo y desde dónde partimos.",
    "Sube a tu ritmo. Arriba se espera, y se baja juntos.",
  ];

  return (
    <section id={chapter.id} data-chapter={chapter.id} className="ix-wrap ix-chapter ix-contact" aria-labelledby={`${chapter.id}-titulo`}>
      <ChapterHead chapter={chapter} />

      <div className="ix-grid ix-intro">
        <p className="ix-lead ix-intro__lead" data-reveal>
          Si te apetece subir con nosotros, escríbenos por Instagram. No importa tu ritmo: importa que quieras subir.
        </p>
      </div>

      <p className="ix-cta" data-reveal style={{ "--len": club.instagramHandle.length } as React.CSSProperties}>
        <a href={club.instagram} className="ix-cta__link" target="_blank" rel="noopener noreferrer">
          <span>{club.instagramHandle}</span>
          <span className="sr-only"> en Instagram (se abre en una pestaña nueva)</span>
          <Arrow className="ix-cta__arrow" />
          <span className="ix-cta__rule" aria-hidden="true" />
        </a>
      </p>

      <div className="ix-grid ix-start">
        <h3 className="ix-label ix-start__label" data-reveal>
          Cómo empezar
        </h3>
        <ol className="ix-start__list">
          {steps.map((s, i) => (
            <li key={i} className="ix-start__step" data-reveal="row" style={{ "--d": `${i * 90}ms` } as React.CSSProperties}>
              <span className="ix-start__n">{i + 1}</span>
              <p>{s}</p>
            </li>
          ))}
        </ol>
      </div>

      <dl className="ix-grid ix-reach" data-reveal>
        <div className="ix-reach__item">
          <dt>Instagram</dt>
          <dd>
            <a className="ix-link" href={club.instagram} target="_blank" rel="noopener noreferrer">
              {club.instagramHandle}
              <Arrow />
            </a>
          </dd>
        </div>
        <div className="ix-reach__item">
          <dt>Correo (por confirmar)</dt>
          <dd className="ix-grey">{club.contactEmail}</dd>
        </div>
        <div className="ix-reach__item">
          <dt>Sede</dt>
          <dd>
            {club.town}, {club.province}
          </dd>
        </div>
        <div className="ix-reach__item">
          <dt>Federación</dt>
          <dd>
            {club.federation}, nº {club.federationNumber}
          </dd>
        </div>
      </dl>

      <div className="ix-grid ix-thanks">
        <h3 className="ix-label ix-thanks__label" data-reveal>
          Agradecimientos
        </h3>
        <p className="ix-thanks__text" data-reveal>
          {sponsorsIntro}: {listEs(sponsors.map((s) => s.name))}.
        </p>
      </div>
    </section>
  );
}
